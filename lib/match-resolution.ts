import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { resolveSupportForMatch } from "@/lib/support"
import { checkAndCompleteTournament } from "@/lib/results"

/**
 * Core match-finishing logic shared by declareWinner, disqualification
 * forfeits, and the developer match-override tool: marks the match finished,
 * eliminates the loser, advances the winner (and, for semifinals, the loser)
 * through the bracket wiring, resolves support, and checks for tournament
 * completion. Runs inside a single transaction so a partial advance can
 * never happen.
 */
export async function resolveMatchWinner(matchId: string, winnerId: string) {
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
    throw new Error("Winner must be one of the two players in this match.")
  }
  const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id

  await db.$transaction(async (tx) => {
    await tx.match.update({ where: { id: matchId }, data: { status: "FINISHED", winnerId } })

    if (loserId) {
      await tx.participant.update({ where: { id: loserId }, data: { eliminated: true } })
    }
    await tx.participant.update({
      where: { id: winnerId },
      data: { currentRound: { increment: 1 } },
    })

    if (match.nextMatchId && match.nextMatchSlot) {
      await tx.match.update({
        where: { id: match.nextMatchId },
        data:
          match.nextMatchSlot === 1 ? { player1Id: winnerId } : { player2Id: winnerId },
      })
    }

    if (match.loserToMatchId && match.loserToSlot && loserId) {
      await tx.match.update({
        where: { id: match.loserToMatchId },
        data: match.loserToSlot === 1 ? { player1Id: loserId } : { player2Id: loserId },
      })

      await resolveBronzeWalkoverIfNeeded(
        tx,
        match.tournamentId,
        match.round,
        match.matchNumber,
        match.loserToMatchId
      )
    }

    await resolveSupportForMatch(tx, matchId, match.tournamentId, winnerId)
    await checkAndCompleteTournament(tx, match.tournamentId)
  })
}

/**
 * Developer-only correction tool: rewrites the winner of an already-finished
 * match. Only allowed while whatever it feeds into (next match / bronze
 * match) hasn't itself progressed past SCHEDULED — otherwise downstream
 * support and results could reference a participant that no longer belongs
 * there, so we refuse and point the developer at a full tournament reset
 * instead.
 */
export async function overrideMatchResult(matchId: string, newWinnerId: string) {
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "FINISHED") {
    throw new Error("The match must be finished before its result can be overridden.")
  }
  if (newWinnerId !== match.player1Id && newWinnerId !== match.player2Id) {
    throw new Error("Winner must be one of the two players in this match.")
  }
  if (newWinnerId === match.winnerId) {
    throw new Error("That participant is already the recorded winner.")
  }

  const oldWinnerId = match.winnerId!
  const oldLoserId = oldWinnerId === match.player1Id ? match.player2Id : match.player1Id

  if (match.nextMatchId) {
    const nextMatch = await db.match.findUnique({ where: { id: match.nextMatchId } })
    if (nextMatch && nextMatch.status !== "SCHEDULED") {
      throw new Error(
        "The next match has already progressed — reset the tournament instead of overriding."
      )
    }
  }
  if (match.loserToMatchId) {
    const bronze = await db.match.findUnique({ where: { id: match.loserToMatchId } })
    if (bronze && bronze.status !== "SCHEDULED") {
      throw new Error(
        "The bronze match has already progressed — reset the tournament instead of overriding."
      )
    }
  }

  const tournament = await db.tournament.findUniqueOrThrow({ where: { id: match.tournamentId } })

  await db.$transaction(async (tx) => {
    const support = await tx.support.findMany({ where: { matchId } })
    for (const s of support) {
      if (s.pointsEarned > 0) {
        await tx.tournamentWallet.update({
          where: { userId_tournamentId: { userId: s.userId, tournamentId: match.tournamentId } },
          data: { currentPoints: { decrement: s.pointsEarned } },
        })
      }
      await tx.support.update({ where: { id: s.id }, data: { won: null, pointsEarned: 0 } })
    }

    if (oldLoserId) {
      await tx.participant.update({ where: { id: oldLoserId }, data: { eliminated: false } })
    }
    await tx.participant.update({
      where: { id: oldWinnerId },
      data: { currentRound: { decrement: 1 } },
    })

    if (match.nextMatchId && match.nextMatchSlot) {
      await tx.match.update({
        where: { id: match.nextMatchId },
        data: match.nextMatchSlot === 1 ? { player1Id: null } : { player2Id: null },
      })
    }
    if (match.loserToMatchId && match.loserToSlot) {
      await tx.match.update({
        where: { id: match.loserToMatchId },
        data: match.loserToSlot === 1 ? { player1Id: null } : { player2Id: null },
      })
    }

    if (tournament.status === "COMPLETED") {
      await tx.tournament.update({
        where: { id: match.tournamentId },
        data: {
          status: "IN_PROGRESS",
          winnerParticipantId: null,
          runnerUpParticipantId: null,
          thirdPlaceParticipantId: null,
          bestSupporterId: null,
        },
      })
    }

    await tx.match.update({ where: { id: matchId }, data: { status: "LIVE", winnerId: null } })
  })

  // Redo through the normal, already-tested resolution path with the corrected winner.
  await resolveMatchWinner(matchId, newWinnerId)
}

/**
 * If this semifinal's sibling was a bye (no opponent, so no loser ever
 * feeds the bronze match), the bronze match can never be played — resolve
 * it now as a walkover for the lone loser that did arrive.
 */
async function resolveBronzeWalkoverIfNeeded(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  semifinalRound: number,
  thisMatchNumber: number,
  bronzeMatchId: string
) {
  const sibling = await tx.match.findFirst({
    where: {
      tournamentId,
      round: semifinalRound,
      matchNumber: { not: thisMatchNumber },
      isThirdPlaceMatch: false,
    },
  })
  // Sibling already had (or will separately trigger) its own propagation —
  // a walkover is only needed when the sibling was a bye and never had a loser to send.
  if (!sibling || !sibling.isBye) return

  const bronze = await tx.match.findUnique({ where: { id: bronzeMatchId } })
  if (!bronze || bronze.status === "FINISHED") return

  const loneWinnerId = bronze.player1Id ?? bronze.player2Id
  if (!loneWinnerId) return

  await tx.match.update({
    where: { id: bronze.id },
    data: { status: "FINISHED", winnerId: loneWinnerId, isBye: true },
  })
}

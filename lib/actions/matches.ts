"use server"

import type { Prisma } from "@prisma/client"

import { requireRoleForAction, ForbiddenError } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"
import { resolveMatchWinner } from "@/lib/match-resolution"
import { revalidateTournamentPaths as revalidateTournament } from "@/lib/revalidate"
import { notifySupportOpen, notifyMatchStarted } from "@/lib/notify"

export async function openSupport(matchId: string) {
  const admin = await requireRoleForAction("ADMIN")
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "SCHEDULED") {
    throw new ForbiddenError("Support can only be opened for a scheduled match.")
  }
  if (!match.player1Id || !match.player2Id) {
    throw new ForbiddenError("Both players must be known before opening support.")
  }

  await db.match.update({ where: { id: matchId }, data: { status: "SUPPORT_OPEN" } })
  await logAudit(admin.id, "match.support.open", { matchId })
  await notifySupportOpen(match.tournamentId, match.player1Id, match.player2Id)
  revalidateTournament(match.tournamentId)
}

export async function closeSupport(matchId: string) {
  const admin = await requireRoleForAction("ADMIN")
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "SUPPORT_OPEN") {
    throw new ForbiddenError("Support isn't currently open for this match.")
  }

  await db.match.update({ where: { id: matchId }, data: { status: "SCHEDULED" } })
  await logAudit(admin.id, "match.support.close", { matchId })
  revalidateTournament(match.tournamentId)
}

export async function startMatch(matchId: string) {
  const admin = await requireRoleForAction("ADMIN")
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "SCHEDULED" && match.status !== "SUPPORT_OPEN") {
    throw new ForbiddenError("Match must be scheduled (or support-open) to start.")
  }
  if (!match.player1Id || !match.player2Id) {
    throw new ForbiddenError("Both players must be known before starting the match.")
  }

  await db.$transaction([
    db.match.update({ where: { id: matchId }, data: { status: "LIVE" } }),
    db.tournament.update({ where: { id: match.tournamentId }, data: { status: "IN_PROGRESS" } }),
  ])
  await logAudit(admin.id, "match.start", { matchId })
  await notifyMatchStarted(match.tournamentId, match.player1Id, match.player2Id)
  revalidateTournament(match.tournamentId)
}

export async function declareWinner(matchId: string, winnerId: string) {
  const admin = await requireRoleForAction("ADMIN")
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "LIVE") {
    throw new ForbiddenError("The match must be live to declare a winner.")
  }

  await resolveMatchWinner(matchId, winnerId)
  await logAudit(admin.id, "match.declareWinner", { matchId, winnerId })
  revalidateTournament(match.tournamentId)
}

/**
 * Opens support on every currently-eligible match at once (both players
 * known, not yet started) — e.g. the whole first round right after the
 * bracket is generated, instead of opening each match one at a time.
 */
export async function openAllSupport(tournamentId: string) {
  const admin = await requireRoleForAction("ADMIN")

  const eligible = await db.match.findMany({
    where: {
      tournamentId,
      status: "SCHEDULED",
      isBye: false,
      player1Id: { not: null },
      player2Id: { not: null },
    },
  })

  if (eligible.length === 0) {
    throw new ForbiddenError("No matches are currently eligible for support.")
  }

  await db.match.updateMany({
    where: { id: { in: eligible.map((m) => m.id) } },
    data: { status: "SUPPORT_OPEN" },
  })

  await logAudit(admin.id, "match.support.openAll", { tournamentId, count: eligible.length })
  await Promise.all(eligible.map((m) => notifySupportOpen(tournamentId, m.player1Id, m.player2Id)))
  revalidateTournament(tournamentId)
  return eligible.length
}

/** Closes support on every currently-open match at once. */
export async function closeAllSupport(tournamentId: string) {
  const admin = await requireRoleForAction("ADMIN")

  const result = await db.match.updateMany({
    where: { tournamentId, status: "SUPPORT_OPEN" },
    data: { status: "SCHEDULED" },
  })

  await logAudit(admin.id, "match.support.closeAll", { tournamentId, count: result.count })
  revalidateTournament(tournamentId)
  return result.count
}

/**
 * Swaps two players sitting in (possibly different) matches — either:
 *  - two real matches in the same round, e.g. turning "A vs B" + "C vs D" into
 *    "A vs D" + "B vs C" by swapping B and D, or
 *  - a real match in round N and the round-N+1 match that a bye advanced someone
 *    into, in which case the bye itself is handed to the round-N player instead.
 * Whenever either slot involved is currently filled by a bye winner, that bye
 * match's recorded winner (and the affected participants' currentRound) is kept
 * in sync with whoever ends up in that slot — this applies even to a same-round
 * swap between two players who each arrived via a *different* bye.
 * Restricted to matches that haven't started. By default also restricted to
 * matches with no support given yet, so no support ends up pointing at a player
 * who's no longer in that match — pass `force: true` to override that and instead
 * refund (and delete) any existing support on either match before swapping.
 */
export async function swapBracketPlayers(
  matchAId: string,
  slotA: 1 | 2,
  matchBId: string,
  slotB: 1 | 2,
  force = false
) {
  const admin = await requireRoleForAction("ADMIN")

  if (matchAId === matchBId && slotA === slotB) {
    throw new ForbiddenError("Pick two different players to swap.")
  }

  const [matchA, matchB] = await Promise.all([
    db.match.findUniqueOrThrow({ where: { id: matchAId } }),
    db.match.findUniqueOrThrow({ where: { id: matchBId } }),
  ])

  if (matchA.tournamentId !== matchB.tournamentId) {
    throw new ForbiddenError("Both matches must be in the same tournament.")
  }
  if (matchA.isBye || matchB.isBye || matchA.isThirdPlaceMatch || matchB.isThirdPlaceMatch) {
    throw new ForbiddenError("Byes and the bronze match can't be swapped.")
  }
  if (matchA.status !== "SCHEDULED" || matchB.status !== "SCHEDULED") {
    throw new ForbiddenError("Both matches must still be scheduled (not started) to swap players.")
  }

  const existingSupport = await db.support.findMany({
    where: { matchId: { in: [matchAId, matchBId] } },
  })
  if (existingSupport.length > 0 && !force) {
    throw new ForbiddenError("Can't swap — support has already been given on one of these matches.")
  }

  const playerAId = slotA === 1 ? matchA.player1Id : matchA.player2Id
  const playerBId = slotB === 1 ? matchB.player1Id : matchB.player2Id
  if (!playerAId || !playerBId) {
    throw new ForbiddenError("Both slots must have a player assigned to swap.")
  }
  if (playerAId === playerBId) {
    throw new ForbiddenError("That's the same player.")
  }

  if (matchA.round !== matchB.round && Math.abs(matchA.round - matchB.round) !== 1) {
    throw new ForbiddenError(
      "You can only swap players within the same round, or between a bye and the round it advances into."
    )
  }

  // A slot can only be "bye-fed" if some bye match's nextMatchId/nextMatchSlot points
  // at it and its recorded winner is whoever currently occupies it. Checked for BOTH
  // slots independently (not just in a cross-round swap) — two round-2 players who
  // each arrived via a *different* bye still need their originating byes re-pointed,
  // otherwise the bracket would keep crediting the old occupant with a bye they no
  // longer have.
  const [byeFeedingA, byeFeedingB] = await Promise.all([
    db.match.findFirst({
      where: {
        tournamentId: matchA.tournamentId,
        isBye: true,
        nextMatchId: matchAId,
        nextMatchSlot: slotA,
        winnerId: playerAId,
      },
    }),
    db.match.findFirst({
      where: {
        tournamentId: matchA.tournamentId,
        isBye: true,
        nextMatchId: matchBId,
        nextMatchSlot: slotB,
        winnerId: playerBId,
      },
    }),
  ])

  if (matchA.round !== matchB.round) {
    // Cross-round swaps are only legitimate when the later-round slot is bye-fed —
    // that's the only way a player could legally be sitting a round ahead of the other.
    const laterSlotBye = matchA.round > matchB.round ? byeFeedingA : byeFeedingB
    if (!laterSlotBye) {
      throw new ForbiddenError(
        "That swap doesn't line up with a bye — the later-round player didn't advance into this match via one."
      )
    }
  }

  const updates: Prisma.PrismaPromise<unknown>[] = [
    db.match.update({
      where: { id: matchAId },
      data: slotA === 1 ? { player1Id: playerBId } : { player2Id: playerBId },
    }),
    db.match.update({
      where: { id: matchBId },
      data: slotB === 1 ? { player1Id: playerAId } : { player2Id: playerAId },
    }),
  ]

  if (byeFeedingA) {
    // playerB now holds the bye that used to feed matchA's slot.
    updates.push(
      db.match.update({
        where: { id: byeFeedingA.id },
        data: {
          winnerId: playerBId,
          player1Id: byeFeedingA.player1Id ? playerBId : byeFeedingA.player1Id,
          player2Id: byeFeedingA.player2Id ? playerBId : byeFeedingA.player2Id,
        },
      }),
      db.participant.update({ where: { id: playerBId }, data: { currentRound: byeFeedingA.round + 1 } })
    )
    // playerA is leaving that bye — only actually drops a round if the match they're
    // moving into is earlier (a same-round swap keeps them at the same round either way).
    if (matchB.round < matchA.round) {
      updates.push(db.participant.update({ where: { id: playerAId }, data: { currentRound: matchB.round } }))
    }
  }
  if (byeFeedingB) {
    updates.push(
      db.match.update({
        where: { id: byeFeedingB.id },
        data: {
          winnerId: playerAId,
          player1Id: byeFeedingB.player1Id ? playerAId : byeFeedingB.player1Id,
          player2Id: byeFeedingB.player2Id ? playerAId : byeFeedingB.player2Id,
        },
      }),
      db.participant.update({ where: { id: playerAId }, data: { currentRound: byeFeedingB.round + 1 } })
    )
    if (matchA.round < matchB.round) {
      updates.push(db.participant.update({ where: { id: playerBId }, data: { currentRound: matchA.round } }))
    }
  }

  if (existingSupport.length > 0) {
    // Refund the stake on every support record tied to either match, then remove
    // them — once the lineup changes, those predictions no longer mean anything.
    for (const s of existingSupport) {
      updates.push(
        db.tournamentWallet.update({
          where: { userId_tournamentId: { userId: s.userId, tournamentId: matchA.tournamentId } },
          data: { currentPoints: { increment: s.pointsSpent } },
        })
      )
    }
    updates.push(
      db.support.deleteMany({ where: { id: { in: existingSupport.map((s) => s.id) } } })
    )
  }

  await db.$transaction(updates)

  await logAudit(admin.id, "match.swapPlayers", {
    matchAId,
    slotA,
    matchBId,
    slotB,
    playerAId,
    playerBId,
    byeFeedingAId: byeFeedingA?.id ?? null,
    byeFeedingBId: byeFeedingB?.id ?? null,
    refundedSupportCount: existingSupport.length,
  })
  revalidateTournament(matchA.tournamentId)
}

export async function disqualifyParticipant(tournamentId: string, participantId: string) {
  const admin = await requireRoleForAction("ADMIN")

  const currentMatch = await db.match.findFirst({
    where: {
      tournamentId,
      status: { in: ["SCHEDULED", "SUPPORT_OPEN", "LIVE"] },
      OR: [{ player1Id: participantId }, { player2Id: participantId }],
    },
  })

  if (currentMatch && currentMatch.player1Id && currentMatch.player2Id) {
    const opponentId =
      currentMatch.player1Id === participantId ? currentMatch.player2Id : currentMatch.player1Id
    // Force the match live first if needed so resolution rules are satisfied, then forfeit it.
    if (currentMatch.status !== "LIVE") {
      await db.match.update({ where: { id: currentMatch.id }, data: { status: "LIVE" } })
    }
    await resolveMatchWinner(currentMatch.id, opponentId)
  } else {
    await db.participant.update({ where: { id: participantId }, data: { eliminated: true } })
  }

  await logAudit(admin.id, "participant.disqualify", { tournamentId, participantId })
  revalidateTournament(tournamentId)
}

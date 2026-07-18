"use server"

import { requireRoleForAction, ForbiddenError } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"
import { resolveMatchWinner } from "@/lib/match-resolution"
import { revalidateTournamentPaths as revalidateTournament } from "@/lib/revalidate"

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
 * Swaps two players sitting in (possibly different) matches of the same round —
 * e.g. turning "A vs B" + "C vs D" into "A vs D" + "B vs C" by swapping B and D.
 * Restricted to matches that haven't started and have no support yet, so no
 * support ends up pointing at a player who's no longer in that match.
 */
export async function swapBracketPlayers(
  matchAId: string,
  slotA: 1 | 2,
  matchBId: string,
  slotB: 1 | 2
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
  if (matchA.round !== matchB.round) {
    throw new ForbiddenError("You can only swap players within the same round.")
  }
  if (matchA.isBye || matchB.isBye || matchA.isThirdPlaceMatch || matchB.isThirdPlaceMatch) {
    throw new ForbiddenError("Byes and the bronze match can't be swapped.")
  }
  if (matchA.status !== "SCHEDULED" || matchB.status !== "SCHEDULED") {
    throw new ForbiddenError("Both matches must still be scheduled (not started) to swap players.")
  }

  const [supportA, supportB] = await Promise.all([
    db.support.count({ where: { matchId: matchAId } }),
    db.support.count({ where: { matchId: matchBId } }),
  ])
  if (supportA > 0 || supportB > 0) {
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

  await db.$transaction([
    db.match.update({
      where: { id: matchAId },
      data: slotA === 1 ? { player1Id: playerBId } : { player2Id: playerBId },
    }),
    db.match.update({
      where: { id: matchBId },
      data: slotB === 1 ? { player1Id: playerAId } : { player2Id: playerAId },
    }),
  ])

  await logAudit(admin.id, "match.swapPlayers", {
    matchAId,
    slotA,
    matchBId,
    slotB,
    playerAId,
    playerBId,
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

"use server"

import { requireRoleForAction, ForbiddenError } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"
import { resolveMatchWinner } from "@/lib/match-resolution"
import { revalidateTournamentPaths as revalidateTournament } from "@/lib/revalidate"

export async function scheduleMatch(matchId: string, scheduledTime: string) {
  const admin = await requireRoleForAction("ADMIN")
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  await db.match.update({ where: { id: matchId }, data: { scheduledTime: new Date(scheduledTime) } })

  await logAudit(admin.id, "match.schedule", { matchId, scheduledTime })
  revalidateTournament(match.tournamentId)
}

export async function openBetting(matchId: string) {
  const admin = await requireRoleForAction("ADMIN")
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "SCHEDULED") {
    throw new ForbiddenError("Betting can only be opened for a scheduled match.")
  }
  if (!match.player1Id || !match.player2Id) {
    throw new ForbiddenError("Both players must be known before opening betting.")
  }

  await db.match.update({ where: { id: matchId }, data: { status: "BETTING_OPEN" } })
  await logAudit(admin.id, "match.betting.open", { matchId })
  revalidateTournament(match.tournamentId)
}

export async function closeBetting(matchId: string) {
  const admin = await requireRoleForAction("ADMIN")
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "BETTING_OPEN") {
    throw new ForbiddenError("Betting isn't currently open for this match.")
  }

  await db.match.update({ where: { id: matchId }, data: { status: "SCHEDULED" } })
  await logAudit(admin.id, "match.betting.close", { matchId })
  revalidateTournament(match.tournamentId)
}

export async function startMatch(matchId: string) {
  const admin = await requireRoleForAction("ADMIN")
  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "SCHEDULED" && match.status !== "BETTING_OPEN") {
    throw new ForbiddenError("Match must be scheduled (or in betting) to start.")
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

export async function disqualifyParticipant(tournamentId: string, participantId: string) {
  const admin = await requireRoleForAction("ADMIN")

  const currentMatch = await db.match.findFirst({
    where: {
      tournamentId,
      status: { in: ["SCHEDULED", "BETTING_OPEN", "LIVE"] },
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

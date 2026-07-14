"use server"

import { revalidatePath } from "next/cache"
import type { Role } from "@prisma/client"

import { requireRoleForAction, ForbiddenError } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"
import { overrideMatchResult } from "@/lib/match-resolution"
import { revalidateTournamentPaths } from "@/lib/revalidate"

export async function setUserRole(userId: string, role: Role) {
  const dev = await requireRoleForAction("DEVELOPER")
  if (userId === dev.id) throw new ForbiddenError("You can't change your own role.")

  const user = await db.user.update({ where: { id: userId }, data: { role } })

  await logAudit(dev.id, "user.setRole", { userId, role })
  revalidatePath("/developer/admins")
  return user
}

export async function findUserByEmail(email: string) {
  await requireRoleForAction("DEVELOPER")
  return db.user.findUnique({ where: { email: email.trim().toLowerCase() } })
}

export async function resetTournament(tournamentId: string) {
  const dev = await requireRoleForAction("DEVELOPER")

  await db.$transaction([
    db.match.deleteMany({ where: { tournamentId } }),
    db.tournamentWallet.deleteMany({ where: { tournamentId } }),
    db.participant.updateMany({
      where: { tournamentId },
      data: { eliminated: false, currentRound: 1, seed: 0 },
    }),
    db.tournament.update({
      where: { id: tournamentId },
      data: {
        status: "REGISTRATION_CLOSED",
        winnerParticipantId: null,
        runnerUpParticipantId: null,
        thirdPlaceParticipantId: null,
        bestBettorId: null,
      },
    }),
  ])

  await logAudit(dev.id, "tournament.reset", { tournamentId })
  revalidateTournamentPaths(tournamentId)
}

export async function overrideMatch(matchId: string, newWinnerId: string) {
  const dev = await requireRoleForAction("DEVELOPER")

  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })
  await overrideMatchResult(matchId, newWinnerId)

  await logAudit(dev.id, "match.override", { matchId, newWinnerId })
  revalidateTournamentPaths(match.tournamentId)
}

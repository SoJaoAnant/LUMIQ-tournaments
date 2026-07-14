"use server"

import { revalidatePath } from "next/cache"

import { requireRoleForAction, ForbiddenError } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"
import { generateBracketMatches } from "@/lib/bracket"

export async function generateBracket(tournamentId: string) {
  const admin = await requireRoleForAction("ADMIN")

  const tournament = await db.tournament.findUniqueOrThrow({ where: { id: tournamentId } })
  if (tournament.status !== "REGISTRATION_CLOSED") {
    throw new ForbiddenError("Close registration before generating the bracket.")
  }

  const participants = await db.participant.findMany({ where: { tournamentId } })
  if (participants.length < 2) {
    throw new ForbiddenError("Need at least 2 participants to generate a bracket.")
  }

  const { rounds, matches, seeds } = generateBracketMatches(participants.map((p) => p.id))
  const initialPoints = rounds + 5

  await db.$transaction([
    db.match.createMany({
      data: matches.map((m) => ({
        id: m.id,
        tournamentId,
        round: m.round,
        matchNumber: m.matchNumber,
        player1Id: m.player1Id,
        player2Id: m.player2Id,
        winnerId: m.winnerId,
        status: m.status,
        isBye: m.isBye,
        isThirdPlaceMatch: m.isThirdPlaceMatch,
        nextMatchId: m.nextMatchId,
        nextMatchSlot: m.nextMatchSlot,
        loserToMatchId: m.loserToMatchId,
        loserToSlot: m.loserToSlot,
      })),
    }),
    db.tournamentWallet.createMany({
      data: participants.map((p) => ({
        userId: p.userId,
        tournamentId,
        currentPoints: initialPoints,
      })),
    }),
    ...participants.map((p) =>
      db.participant.update({
        where: { id: p.id },
        data: {
          seed: seeds[p.id],
          currentRound: matches.some((m) => m.isBye && (m.player1Id === p.id || m.player2Id === p.id))
            ? 2
            : 1,
        },
      })
    ),
    db.tournament.update({ where: { id: tournamentId }, data: { status: "BRACKET_GENERATED" } }),
  ])

  await logAudit(admin.id, "tournament.bracket.generate", {
    tournamentId,
    rounds,
    participantCount: participants.length,
  })

  revalidatePath(`/admin/tournaments/${tournamentId}`)
  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath(`/tournaments/${tournamentId}/bracket`)
  revalidatePath(`/tournaments/${tournamentId}/participants`)
  revalidatePath(`/tournaments/${tournamentId}/rules`)
  revalidatePath("/tournaments")
  revalidatePath("/admin/tournaments")
}

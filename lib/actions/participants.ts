"use server"

import { requireRoleForAction, ForbiddenError } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"
import { revalidateTournamentPaths } from "@/lib/revalidate"

export async function importParticipants(tournamentId: string, emails: string[]) {
  const admin = await requireRoleForAction("ADMIN")

  const tournament = await db.tournament.findUniqueOrThrow({ where: { id: tournamentId } })
  if (tournament.status !== "DRAFT" && tournament.status !== "REGISTRATION_OPEN") {
    throw new ForbiddenError("Participants can only be imported before registration closes.")
  }

  const cleanedEmails = Array.from(
    new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))
  )
  if (cleanedEmails.length === 0) throw new ForbiddenError("No valid emails provided.")

  const users = await db.user.findMany({ where: { email: { in: cleanedEmails } } })
  const existingParticipants = await db.participant.findMany({
    where: { tournamentId, userId: { in: users.map((u) => u.id) } },
  })
  const alreadyJoined = new Set(existingParticipants.map((p) => p.userId))

  const toCreate = users.filter((u) => !alreadyJoined.has(u.id))
  if (toCreate.length > 0) {
    await db.participant.createMany({
      data: toCreate.map((u) => ({ userId: u.id, tournamentId, seed: 0 })),
    })
  }

  const foundEmails = new Set(users.map((u) => u.email))
  const notFound = cleanedEmails.filter((e) => !foundEmails.has(e))

  await logAudit(admin.id, "participants.import", {
    tournamentId,
    imported: toCreate.length,
    alreadyJoined: alreadyJoined.size,
    notFound: notFound.length,
  })

  revalidateTournamentPaths(tournamentId)

  return {
    imported: toCreate.length,
    alreadyJoined: alreadyJoined.size,
    notFound,
  }
}

export async function removeParticipant(tournamentId: string, participantId: string) {
  const admin = await requireRoleForAction("ADMIN")

  const tournament = await db.tournament.findUniqueOrThrow({ where: { id: tournamentId } })
  if (tournament.status === "BRACKET_GENERATED" || tournament.status === "IN_PROGRESS") {
    throw new ForbiddenError(
      "Participants can't be removed once the bracket is generated — disqualify them instead."
    )
  }

  await db.participant.delete({ where: { id: participantId } })

  await logAudit(admin.id, "participant.remove", { tournamentId, participantId })
  revalidateTournamentPaths(tournamentId)
}

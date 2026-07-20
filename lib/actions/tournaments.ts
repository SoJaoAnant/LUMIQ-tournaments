"use server"

import { revalidatePath } from "next/cache"

import { requireRoleForAction, ForbiddenError, getCurrentUser } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"
import { tournamentFormSchema, type TournamentFormInput } from "@/lib/validations/tournament"
import { pitchSchema } from "@/lib/validations/participant"
import { notifyRegistrationOpen } from "@/lib/notify"

export async function createTournament(values: TournamentFormInput) {
  const admin = await requireRoleForAction("ADMIN")
  const data = tournamentFormSchema.parse(values)

  const tournament = await db.tournament.create({
    data: {
      title: data.title,
      description: data.description || null,
      registrationOpen: new Date(data.registrationOpen),
      registrationClose: new Date(data.registrationClose),
      createdById: admin.id,
    },
  })

  await logAudit(admin.id, "tournament.create", { tournamentId: tournament.id, title: tournament.title })
  revalidatePath("/admin/tournaments")
  revalidatePath("/tournaments")
  return tournament
}

export async function updateTournament(tournamentId: string, values: TournamentFormInput) {
  const admin = await requireRoleForAction("ADMIN")
  const data = tournamentFormSchema.parse(values)

  const tournament = await db.tournament.update({
    where: { id: tournamentId },
    data: {
      title: data.title,
      description: data.description || null,
      registrationOpen: new Date(data.registrationOpen),
      registrationClose: new Date(data.registrationClose),
    },
  })

  await logAudit(admin.id, "tournament.update", { tournamentId })
  revalidatePath("/admin/tournaments")
  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath(`/tournaments/${tournamentId}/manage`)
  revalidatePath("/tournaments")
  return tournament
}

export async function deleteTournament(tournamentId: string) {
  const admin = await requireRoleForAction("ADMIN")

  await db.tournament.delete({ where: { id: tournamentId } })

  await logAudit(admin.id, "tournament.delete", { tournamentId })
  revalidatePath("/admin/tournaments")
  revalidatePath("/tournaments")
}

export async function openRegistration(tournamentId: string) {
  const admin = await requireRoleForAction("ADMIN")

  const tournament = await db.tournament.findUniqueOrThrow({ where: { id: tournamentId } })
  if (tournament.status !== "DRAFT") {
    throw new ForbiddenError("Registration can only be opened from Draft status.")
  }

  await db.tournament.update({ where: { id: tournamentId }, data: { status: "REGISTRATION_OPEN" } })
  await logAudit(admin.id, "tournament.registration.open", { tournamentId })
  await notifyRegistrationOpen(tournamentId)
  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath(`/tournaments/${tournamentId}/manage`)
  revalidatePath("/tournaments")
}

export async function closeRegistration(tournamentId: string) {
  const admin = await requireRoleForAction("ADMIN")

  const tournament = await db.tournament.findUniqueOrThrow({ where: { id: tournamentId } })
  if (tournament.status !== "REGISTRATION_OPEN") {
    throw new ForbiddenError("Registration is not currently open.")
  }

  await db.tournament.update({
    where: { id: tournamentId },
    data: { status: "REGISTRATION_CLOSED" },
  })
  await logAudit(admin.id, "tournament.registration.close", { tournamentId })
  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath(`/tournaments/${tournamentId}/manage`)
  revalidatePath("/tournaments")
}

export async function joinTournament(tournamentId: string, isPlayer: boolean, pitch?: string) {
  const user = await getCurrentUser()
  if (!user) throw new ForbiddenError("You must be signed in to join a tournament.")

  const tournament = await db.tournament.findUniqueOrThrow({ where: { id: tournamentId } })

  if (tournament.status !== "REGISTRATION_OPEN") {
    throw new ForbiddenError("Registration is not open for this tournament.")
  }
  if (new Date() > tournament.registrationClose) {
    throw new ForbiddenError("The registration window has closed.")
  }

  const existing = await db.participant.findUnique({
    where: { userId_tournamentId: { userId: user.id, tournamentId } },
  })
  if (existing) throw new ForbiddenError("You've already joined this tournament.")

  // Supporters aren't shown in the bracket, so a pitch to "get more support" doesn't apply to them.
  const cleanPitch = isPlayer ? pitchSchema.parse(pitch) : null

  await db.participant.create({
    data: { userId: user.id, tournamentId, seed: 0, isPlayer, pitch: cleanPitch },
  })

  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath("/dashboard")
}

export async function leaveTournament(tournamentId: string) {
  const user = await getCurrentUser()
  if (!user) throw new ForbiddenError("You must be signed in.")

  const tournament = await db.tournament.findUniqueOrThrow({ where: { id: tournamentId } })

  if (tournament.status !== "REGISTRATION_OPEN" || new Date() > tournament.registrationClose) {
    throw new ForbiddenError("You can only leave while registration is still open.")
  }

  await db.participant.deleteMany({ where: { userId: user.id, tournamentId } })

  revalidatePath(`/tournaments/${tournamentId}`)
  revalidatePath("/dashboard")
}

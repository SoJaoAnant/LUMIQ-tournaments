import "server-only"

import type { NotificationType } from "@prisma/client"

import { db } from "@/lib/db"

/** Never lets a notification failure break the mutation it's attached to — same philosophy as logAudit. */
async function safe(type: NotificationType, fn: () => Promise<void>) {
  try {
    await fn()
  } catch (err) {
    console.error("Failed to send notification", type, err)
  }
}

async function getTournamentTitle(tournamentId: string) {
  const tournament = await db.tournament.findUnique({
    where: { id: tournamentId },
    select: { title: true },
  })
  return tournament?.title ?? "Tournament"
}

async function loadPlayerNames(ids: (string | null)[]) {
  const cleanIds = ids.filter((id): id is string => !!id)
  if (cleanIds.length === 0) return new Map<string, string>()

  const participants = await db.participant.findMany({
    where: { id: { in: cleanIds } },
    include: { user: { select: { name: true } } },
  })
  return new Map(participants.map((p) => [p.id, p.user.name]))
}

async function matchLabel(names: Map<string, string>, player1Id: string | null, player2Id: string | null) {
  const nameOf = (id: string | null) => (id && names.get(id)) || "TBD"
  return `${nameOf(player1Id)} vs ${nameOf(player2Id)}`
}

async function notifyParticipants(
  tournamentId: string,
  input: { type: NotificationType; title: string; body: string; link: string }
) {
  const participants = await db.participant.findMany({
    where: { tournamentId },
    select: { userId: true },
  })
  if (participants.length === 0) return

  await db.notification.createMany({
    data: participants.map((p) => ({
      userId: p.userId,
      tournamentId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    })),
  })
}

export async function notifyAnnouncement(tournamentId: string, announcementTitle: string) {
  await safe("ANNOUNCEMENT", async () => {
    const title = await getTournamentTitle(tournamentId)
    await notifyParticipants(tournamentId, {
      type: "ANNOUNCEMENT",
      title,
      body: `New announcement: ${announcementTitle}`,
      link: `/tournaments/${tournamentId}`,
    })
  })
}

export async function notifySupportOpen(
  tournamentId: string,
  player1Id: string | null,
  player2Id: string | null
) {
  await safe("SUPPORT_OPEN", async () => {
    const [title, names] = await Promise.all([
      getTournamentTitle(tournamentId),
      loadPlayerNames([player1Id, player2Id]),
    ])
    const label = await matchLabel(names, player1Id, player2Id)
    await notifyParticipants(tournamentId, {
      type: "SUPPORT_OPEN",
      title,
      body: `Support window open for ${label}`,
      link: `/tournaments/${tournamentId}/support`,
    })
  })
}

export async function notifyMatchStarted(
  tournamentId: string,
  player1Id: string | null,
  player2Id: string | null
) {
  await safe("MATCH_STARTED", async () => {
    const [title, names] = await Promise.all([
      getTournamentTitle(tournamentId),
      loadPlayerNames([player1Id, player2Id]),
    ])
    const label = await matchLabel(names, player1Id, player2Id)
    await notifyParticipants(tournamentId, {
      type: "MATCH_STARTED",
      title,
      body: `Match between ${label} has started`,
      link: `/tournaments/${tournamentId}/bracket`,
    })
  })
}

export async function notifyMatchFinished(
  tournamentId: string,
  player1Id: string | null,
  player2Id: string | null,
  winnerId: string | null
) {
  await safe("MATCH_FINISHED", async () => {
    const [title, names] = await Promise.all([
      getTournamentTitle(tournamentId),
      loadPlayerNames([player1Id, player2Id]),
    ])
    const label = await matchLabel(names, player1Id, player2Id)
    const winnerName = winnerId ? names.get(winnerId) : undefined
    await notifyParticipants(tournamentId, {
      type: "MATCH_FINISHED",
      title,
      body: winnerName ? `Match between ${label} is done — ${winnerName} won` : `Match between ${label} is done`,
      link: `/tournaments/${tournamentId}/bracket`,
    })
  })
}

export async function notifyTournamentFinished(tournamentId: string) {
  await safe("TOURNAMENT_FINISHED", async () => {
    const title = await getTournamentTitle(tournamentId)
    await notifyParticipants(tournamentId, {
      type: "TOURNAMENT_FINISHED",
      title,
      body: "Ended — see the results",
      link: `/tournaments/${tournamentId}/results`,
    })
  })
}

export async function notifyRegistrationOpen(tournamentId: string) {
  await safe("REGISTRATION_OPEN", async () => {
    const [title, users] = await Promise.all([
      getTournamentTitle(tournamentId),
      db.user.findMany({ select: { id: true } }),
    ])
    if (users.length === 0) return

    await db.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        tournamentId,
        type: "REGISTRATION_OPEN" as const,
        title,
        body: "Registration is now open — join the tournament",
        link: `/tournaments/${tournamentId}`,
      })),
    })
  })
}

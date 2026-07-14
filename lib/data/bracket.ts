import { cache } from "react"
import type { Match } from "@prisma/client"

import { db } from "@/lib/db"
import { getRoundLabel } from "@/lib/bracket"

export const getBracketData = cache(async (tournamentId: string) => {
  const matches = await db.match.findMany({
    where: { tournamentId },
    orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
  })

  const participantIds = new Set<string>()
  matches.forEach((m) => {
    if (m.player1Id) participantIds.add(m.player1Id)
    if (m.player2Id) participantIds.add(m.player2Id)
  })

  const participants = participantIds.size
    ? await db.participant.findMany({
        where: { id: { in: [...participantIds] } },
        include: { user: { select: { name: true } } },
      })
    : []

  const players: Record<string, { name: string; seed: number; eliminated: boolean }> = {}
  participants.forEach((p) => {
    players[p.id] = { name: p.user.name, seed: p.seed, eliminated: p.eliminated }
  })

  return { matches, players }
})

export type TournamentStage = {
  roundLabel: string
  live: boolean
  bettingOpen: boolean
  concluded: boolean
}

/** The single "what's happening right now" match — drives the header pill and the overview hero card. */
export function getFeaturedMatch(matches: Match[]): Match | null {
  const real = matches.filter((m) => !m.isBye && !m.isThirdPlaceMatch)
  if (real.length === 0) return null

  const byRound = (a: Match, b: Match) => a.round - b.round

  return (
    real.find((m) => m.status === "LIVE") ??
    real.find((m) => m.status === "BETTING_OPEN") ??
    [...real].filter((m) => m.status === "SCHEDULED").sort(byRound)[0] ??
    [...real].sort((a, b) => b.round - a.round)[0]
  )
}

export function getTournamentStage(matches: Match[], totalRounds: number): TournamentStage | null {
  const match = getFeaturedMatch(matches)
  if (!match) return null

  const real = matches.filter((m) => !m.isBye && !m.isThirdPlaceMatch)
  const concluded = real.every((m) => m.status === "FINISHED")

  return {
    roundLabel: getRoundLabel(match.round, totalRounds),
    live: match.status === "LIVE",
    bettingOpen: match.status === "BETTING_OPEN",
    concluded,
  }
}

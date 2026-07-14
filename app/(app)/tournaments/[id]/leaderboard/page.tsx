import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getMyParticipation, getTournament } from "@/lib/data/tournaments"
import { getBettingLeaderboard } from "@/lib/data/leaderboard"
import { getRoundLabel } from "@/lib/bracket"
import { AvatarTile } from "@/components/shared/avatar-tile"
import { RankBadge } from "@/components/shared/rank-badge"
import { LeaderboardToggle } from "@/components/tournament/leaderboard-toggle"
import { EmptyState } from "@/components/shared/empty-state"
import { Medal, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function TournamentLeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const [participation, participants, bettingLeaderboard] = await Promise.all([
    getMyParticipation(id, user.id),
    db.participant.findMany({
      where: { tournamentId: id },
      include: { user: { select: { name: true } } },
    }),
    getBettingLeaderboard(id),
  ])

  const totalRounds = participants.length ? Math.ceil(Math.log2(participants.length)) : 0

  const rankedPlayers = [...participants].sort((a, b) => {
    if (a.id === tournament.winnerParticipantId) return -1
    if (b.id === tournament.winnerParticipantId) return 1
    if (a.id === tournament.runnerUpParticipantId) return -1
    if (b.id === tournament.runnerUpParticipantId) return 1
    if (a.id === tournament.thirdPlaceParticipantId) return -1
    if (b.id === tournament.thirdPlaceParticipantId) return 1
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1
    return b.currentRound - a.currentRound
  })

  const reachedLabel = (p: (typeof participants)[number]) => {
    if (p.id === tournament.winnerParticipantId) return "Champion"
    if (p.id === tournament.runnerUpParticipantId) return "Runner-up"
    if (p.id === tournament.thirdPlaceParticipantId) return "3rd Place"
    const roundLabel = getRoundLabel(p.currentRound, totalRounds)
    return p.eliminated ? `Out · ${roundLabel}` : `Active · ${roundLabel}`
  }

  const bettors =
    bettingLeaderboard.length === 0 ? (
      <EmptyState icon={Trophy} title="No betting activity yet" />
    ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid grid-cols-[2.5rem_1fr_auto_auto] gap-x-3 gap-y-1 px-4 py-3 text-xs font-semibold text-muted-foreground sm:grid-cols-[2.5rem_1fr_5rem_5rem]">
          <span>Rank</span>
          <span>Bettor</span>
          <span className="text-right">Points</span>
          <span className="text-right">Acc.</span>
          {bettingLeaderboard.map((row, i) => (
            <div key={row.userId} className="contents">
              <div
                className={cn(
                  "col-span-4 grid grid-cols-subgrid items-center rounded-xl px-0 py-2",
                  row.userId === user.id && "bg-primary/8 ring-1 ring-primary/30"
                )}
              >
                <RankBadge rank={i + 1} />
                <div className="flex min-w-0 items-center gap-2">
                  <AvatarTile name={row.name} size="sm" />
                  <span className="truncate text-sm font-medium text-foreground">
                    {row.name}
                    {row.userId === user.id && (
                      <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                    )}
                  </span>
                </div>
                <span className="text-right font-heading text-sm font-bold text-foreground">
                  {row.points}
                </span>
                <span className="text-right text-sm text-muted-foreground">{row.accuracy}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )

  const players =
    rankedPlayers.length === 0 ? (
      <EmptyState icon={Medal} title="No participants yet" />
    ) : (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <ul className="divide-y divide-border">
          {rankedPlayers.map((p, i) => (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3",
                p.id === participation?.id && "bg-primary/8"
              )}
            >
              <RankBadge rank={i + 1} />
              <AvatarTile name={p.user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.user.name}
                  {p.id === participation?.id && (
                    <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Seed #{p.seed}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                  !p.eliminated ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {reachedLabel(p)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )

  return <LeaderboardToggle bettors={bettors} players={players} />
}

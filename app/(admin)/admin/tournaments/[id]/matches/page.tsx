import { notFound } from "next/navigation"
import { Swords } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { getBracketData } from "@/lib/data/bracket"
import { getRoundLabel } from "@/lib/bracket"
import { MatchStatusBadge } from "@/components/matches/match-status-badge"
import { MatchAdminControls } from "@/components/admin/match-admin-controls"
import { BulkBettingControls } from "@/components/admin/bulk-betting-controls"
import { EmptyState } from "@/components/shared/empty-state"

export default async function AdminMatchesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await requireRole("ADMIN")
  const { id } = await params

  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  const { matches, players } = await getBracketData(id)

  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Swords}
        title="No matches yet"
        description="Generate the bracket first — matches will appear here."
      />
    )
  }

  const totalRounds = Math.max(...matches.map((m) => m.round))
  const sorted = [...matches].sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)

  return (
    <div className="flex flex-col gap-4">
      <BulkBettingControls
        tournamentId={id}
        eligibleCount={
          matches.filter((m) => m.status === "SCHEDULED" && !m.isBye && m.player1Id && m.player2Id)
            .length
        }
        openCount={matches.filter((m) => m.status === "BETTING_OPEN").length}
      />

      <div className="flex flex-col gap-3">
        {sorted.map((m) => {
          const p1 = m.player1Id ? players[m.player1Id] : undefined
          const p2 = m.player2Id ? players[m.player2Id] : undefined
          return (
            <div
              key={m.id}
              className="flex flex-col gap-3 rounded-2xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {m.isThirdPlaceMatch ? "3rd Place Match" : getRoundLabel(m.round, totalRounds)} ·
                  Match {m.matchNumber}
                </p>
                <p className="text-sm">
                  {p1?.name ?? "TBD"} <span className="text-muted-foreground">vs</span>{" "}
                  {p2?.name ?? "TBD"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <MatchStatusBadge status={m.status} />
                <MatchAdminControls
                  match={m}
                  players={players}
                  isDeveloper={admin.role === "DEVELOPER"}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { notFound } from "next/navigation"
import { BarChart3 } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { getBracketData } from "@/lib/data/bracket"
import { getRoundLabel } from "@/lib/bracket"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"

export default async function AdminBettingStatsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  const [{ matches, players }, bets] = await Promise.all([
    getBracketData(id),
    db.bet.findMany({ where: { match: { tournamentId: id } } }),
  ])

  const totalRounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0
  const betsByMatch = new Map<string, typeof bets>()
  bets.forEach((b) => {
    betsByMatch.set(b.matchId, [...(betsByMatch.get(b.matchId) ?? []), b])
  })

  const matchesWithBets = matches.filter((m) => betsByMatch.has(m.id))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Bets</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{bets.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Points Wagered</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {bets.reduce((sum, b) => sum + b.pointsSpent, 0)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Points Paid Out</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {bets.reduce((sum, b) => sum + b.pointsEarned, 0)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" />
            Bets by Match
          </CardTitle>
        </CardHeader>
        <CardContent>
          {matchesWithBets.length === 0 ? (
            <EmptyState icon={BarChart3} title="No bets placed yet" />
          ) : (
            <div className="flex flex-col gap-3">
              {matchesWithBets
                .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)
                .map((m) => {
                  const matchBets = betsByMatch.get(m.id) ?? []
                  const p1Bets = matchBets.filter((b) => b.predictedWinnerId === m.player1Id).length
                  const p2Bets = matchBets.filter((b) => b.predictedWinnerId === m.player2Id).length
                  return (
                    <div key={m.id} className="rounded-2xl border border-border p-4">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {getRoundLabel(m.round, totalRounds)} · Match {m.matchNumber}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          {m.player1Id ? players[m.player1Id]?.name : "TBD"} —{" "}
                          <strong>{p1Bets}</strong> bets
                        </span>
                        <span>
                          {m.player2Id ? players[m.player2Id]?.name : "TBD"} —{" "}
                          <strong>{p2Bets}</strong> bets
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

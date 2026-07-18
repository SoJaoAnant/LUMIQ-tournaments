import { notFound } from "next/navigation"
import { Ticket } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTournament } from "@/lib/data/tournaments"
import { getBracketData } from "@/lib/data/bracket"
import { computeRounds } from "@/lib/bracket"
import { getInitialWalletPoints } from "@/lib/support"
import { SupportBuilder } from "@/components/support/support-builder"
import { WalletHeroCard } from "@/components/support/wallet-hero-card"
import { SupportRulesCard } from "@/components/support/support-rules-card"
import { SupportHistoryList, type SupportHistoryRow } from "@/components/support/support-history-list"
import { EmptyState } from "@/components/shared/empty-state"

export default async function TournamentSupportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const [wallet, { matches, players }, mySupport, participantCount] = await Promise.all([
    db.tournamentWallet.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId: id } },
    }),
    getBracketData(id),
    db.support.findMany({
      where: { userId: user.id, match: { tournamentId: id } },
      include: { match: true },
      orderBy: { lockedAt: "desc" },
    }),
    db.participant.count({ where: { tournamentId: id } }),
  ])

  const totalRounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0
  const rounds = participantCount > 0 ? computeRounds(participantCount) : null
  const initialPoints = rounds !== null ? getInitialWalletPoints(rounds) : null

  const supportByMatch = new Map(mySupport.map((s) => [s.matchId, s]))
  const canSupport = (wallet?.currentPoints ?? 0) >= 1
  const openMatches = matches.filter(
    (m) => m.status === "SUPPORT_OPEN" && m.player1Id && m.player2Id
  )

  const correct = mySupport.filter((s) => s.won === true).length
  const incorrect = mySupport.filter((s) => s.won === false).length

  const historyRows: SupportHistoryRow[] = mySupport.map((s) => ({
    id: s.id,
    matchRound: s.match.round,
    matchNumber: s.match.matchNumber,
    predictedWinnerName: players[s.predictedWinnerId]?.name ?? "—",
    won: s.won,
    pointsEarned: s.pointsEarned,
    pointsSpent: s.pointsSpent,
  }))

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[1.7fr_1fr]">
      <div className="flex min-w-0 flex-col gap-4">
        {openMatches.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No matches open for support right now"
            description="Check back once an admin opens support for the next match."
          />
        ) : (
          openMatches.map((m) => (
            <SupportBuilder
              key={m.id}
              matchId={m.id}
              round={m.round}
              totalRounds={totalRounds}
              player1Id={m.player1Id!}
              player2Id={m.player2Id!}
              players={players}
              existingPredictedWinnerId={supportByMatch.get(m.id)?.predictedWinnerId ?? null}
              canSupport={canSupport}
            />
          ))
        )}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-base font-bold">Your support history</h2>
          <SupportHistoryList support={historyRows} totalRounds={totalRounds} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <WalletHeroCard points={wallet?.currentPoints} correct={correct} incorrect={incorrect} />
        <SupportRulesCard rounds={rounds} initialPoints={initialPoints} />
      </div>
    </div>
  )
}

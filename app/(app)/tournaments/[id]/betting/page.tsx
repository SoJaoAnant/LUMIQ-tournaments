import { notFound } from "next/navigation"
import { Ticket } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTournament } from "@/lib/data/tournaments"
import { getBracketData } from "@/lib/data/bracket"
import { computeRounds } from "@/lib/bracket"
import { getInitialWalletPoints } from "@/lib/betting"
import { BetBuilder } from "@/components/betting/bet-builder"
import { WalletHeroCard } from "@/components/betting/wallet-hero-card"
import { BettingRulesCard } from "@/components/betting/betting-rules-card"
import { BetHistoryList, type BetHistoryRow } from "@/components/betting/bet-history-list"
import { EmptyState } from "@/components/shared/empty-state"

export default async function TournamentBettingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const [wallet, { matches, players }, myBets, participantCount] = await Promise.all([
    db.tournamentWallet.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId: id } },
    }),
    getBracketData(id),
    db.bet.findMany({
      where: { userId: user.id, match: { tournamentId: id } },
      include: { match: true },
      orderBy: { lockedAt: "desc" },
    }),
    db.participant.count({ where: { tournamentId: id } }),
  ])

  const totalRounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0
  const rounds = participantCount > 0 ? computeRounds(participantCount) : null
  const initialPoints = rounds !== null ? getInitialWalletPoints(rounds) : null

  const betsByMatch = new Map(myBets.map((b) => [b.matchId, b]))
  const canBet = (wallet?.currentPoints ?? 0) >= 1
  const openMatches = matches.filter(
    (m) => m.status === "BETTING_OPEN" && m.player1Id && m.player2Id
  )

  const correct = myBets.filter((b) => b.won === true).length
  const incorrect = myBets.filter((b) => b.won === false).length

  const historyRows: BetHistoryRow[] = myBets.map((b) => ({
    id: b.id,
    matchRound: b.match.round,
    matchNumber: b.match.matchNumber,
    predictedWinnerName: players[b.predictedWinnerId]?.name ?? "—",
    won: b.won,
    pointsEarned: b.pointsEarned,
    pointsSpent: b.pointsSpent,
  }))

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[1.7fr_1fr]">
      <div className="flex min-w-0 flex-col gap-4">
        {openMatches.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No matches open for betting right now"
            description="Check back once an admin opens betting on the next match."
          />
        ) : (
          openMatches.map((m) => (
            <BetBuilder
              key={m.id}
              matchId={m.id}
              round={m.round}
              totalRounds={totalRounds}
              player1Id={m.player1Id!}
              player2Id={m.player2Id!}
              players={players}
              existingPredictedWinnerId={betsByMatch.get(m.id)?.predictedWinnerId ?? null}
              canBet={canBet}
            />
          ))
        )}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-base font-bold">Your betting history</h2>
          <BetHistoryList bets={historyRows} totalRounds={totalRounds} />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <WalletHeroCard points={wallet?.currentPoints} correct={correct} incorrect={incorrect} />
        <BettingRulesCard rounds={rounds} initialPoints={initialPoints} />
      </div>
    </div>
  )
}

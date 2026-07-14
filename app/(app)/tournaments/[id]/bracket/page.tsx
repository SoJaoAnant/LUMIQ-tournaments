import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTournament } from "@/lib/data/tournaments"
import { getBracketData } from "@/lib/data/bracket"
import { BracketView } from "@/components/bracket/bracket-view"

export default async function TournamentBracketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const [{ matches, players }, wallet, myBets] = await Promise.all([
    getBracketData(id),
    db.tournamentWallet.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId: id } },
    }),
    db.bet.findMany({ where: { userId: user.id, match: { tournamentId: id } } }),
  ])

  const betsByMatch = Object.fromEntries(myBets.map((b) => [b.matchId, b.predictedWinnerId]))

  return (
    <BracketView
      matches={matches}
      players={players}
      bettable
      betsByMatch={betsByMatch}
      canBet={(wallet?.currentPoints ?? 0) >= 1}
    />
  )
}

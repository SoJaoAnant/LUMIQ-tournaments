import type { Prisma } from "@prisma/client"

/**
 * Call after every match resolution. If the final (and bronze match, when one
 * exists) are now finished, marks the tournament COMPLETED and records the
 * three podium finishers plus the best bettor. No-op otherwise.
 */
export async function checkAndCompleteTournament(
  tx: Prisma.TransactionClient,
  tournamentId: string
) {
  const matches = await tx.match.findMany({ where: { tournamentId } })
  if (matches.length === 0) return

  const rounds = Math.max(...matches.map((m) => m.round))
  const final = matches.find((m) => m.round === rounds && !m.isThirdPlaceMatch)
  const bronze = matches.find((m) => m.isThirdPlaceMatch)

  if (!final || final.status !== "FINISHED") return
  if (bronze && bronze.status !== "FINISHED") return

  const runnerUpId =
    final.winnerId === final.player1Id ? final.player2Id : final.player1Id

  const bestBettorId = await computeBestBettor(tx, tournamentId)

  await tx.tournament.update({
    where: { id: tournamentId },
    data: {
      status: "COMPLETED",
      winnerParticipantId: final.winnerId,
      runnerUpParticipantId: runnerUpId,
      thirdPlaceParticipantId: bronze?.winnerId ?? null,
      bestBettorId,
    },
  })
}

async function computeBestBettor(tx: Prisma.TransactionClient, tournamentId: string) {
  const wallets = await tx.tournamentWallet.findMany({ where: { tournamentId } })
  if (wallets.length === 0) return null

  const bets = await tx.bet.findMany({
    where: { match: { tournamentId }, won: { not: null } },
  })

  const statsByUser = new Map<string, { correct: number; total: number }>()
  for (const bet of bets) {
    const stats = statsByUser.get(bet.userId) ?? { correct: 0, total: 0 }
    stats.total += 1
    if (bet.won) stats.correct += 1
    statsByUser.set(bet.userId, stats)
  }

  const ranked = wallets
    .map((w) => {
      const stats = statsByUser.get(w.userId) ?? { correct: 0, total: 0 }
      const accuracy = stats.total > 0 ? stats.correct / stats.total : 0
      return { userId: w.userId, points: w.currentPoints, accuracy, correct: stats.correct }
    })
    .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || b.correct - a.correct)

  return ranked[0]?.userId ?? null
}

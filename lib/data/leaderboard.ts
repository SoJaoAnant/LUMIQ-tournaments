import { cache } from "react"

import { db } from "@/lib/db"

export const getBettingLeaderboard = cache(async (tournamentId: string) => {
  const wallets = await db.tournamentWallet.findMany({
    where: { tournamentId },
    include: { user: { select: { name: true } } },
  })

  const bets = await db.bet.findMany({
    where: { match: { tournamentId }, won: { not: null } },
  })

  const statsByUser = new Map<string, { correct: number; incorrect: number }>()
  for (const bet of bets) {
    const stats = statsByUser.get(bet.userId) ?? { correct: 0, incorrect: 0 }
    if (bet.won) stats.correct += 1
    else stats.incorrect += 1
    statsByUser.set(bet.userId, stats)
  }

  return wallets
    .map((w) => {
      const stats = statsByUser.get(w.userId) ?? { correct: 0, incorrect: 0 }
      const total = stats.correct + stats.incorrect
      return {
        userId: w.userId,
        name: w.user.name,
        points: w.currentPoints,
        correct: stats.correct,
        incorrect: stats.incorrect,
        accuracy: total > 0 ? Math.round((stats.correct / total) * 100) : 0,
      }
    })
    .sort((a, b) => b.points - a.points || b.accuracy - a.accuracy || b.correct - a.correct)
})

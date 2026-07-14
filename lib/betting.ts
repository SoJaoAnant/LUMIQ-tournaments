import type { Prisma } from "@prisma/client"

/**
 * Resolves every bet placed on a finished match: correct predictions earn
 * back 2 points (net +1 after the 1 already spent at placement), wrong ones
 * earn nothing (net -1, the spent point stays lost). Must run inside the
 * same transaction that sets the match's winner.
 */
export async function resolveBetsForMatch(
  tx: Prisma.TransactionClient,
  matchId: string,
  tournamentId: string,
  winnerId: string
) {
  const bets = await tx.bet.findMany({ where: { matchId } })

  for (const bet of bets) {
    const won = bet.predictedWinnerId === winnerId
    const pointsEarned = won ? 2 : 0

    await tx.bet.update({
      where: { id: bet.id },
      data: { won, pointsEarned },
    })

    if (pointsEarned > 0) {
      await tx.tournamentWallet.update({
        where: { userId_tournamentId: { userId: bet.userId, tournamentId } },
        data: { currentPoints: { increment: pointsEarned } },
      })
    }
  }
}

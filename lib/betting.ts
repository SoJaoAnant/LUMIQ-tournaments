import type { Prisma } from "@prisma/client"

/**
 * Stakes escalate a point per round — round 1 (e.g. the quarterfinal in an
 * 8-player cup) costs 1 point to bet, round 2 (semifinal) costs 2, round 3
 * (final) costs 3, and so on. Win: get back double the stake. Lose: the
 * staked points are gone — if the wallet didn't have enough to cover the
 * stake, it's allowed to go negative (deliberately: a big loss in a late,
 * high-stakes round should sting).
 */
export function getBetStake(round: number) {
  return round
}

/**
 * Initial per-tournament wallet balance: enough to bet every single round
 * and lose every single time (1 + 2 + ... + rounds, the triangular number),
 * plus the same +5 cushion the original flat-1-point rule used. Without the
 * triangular sum, bigger brackets (5+ rounds) would make going negative from
 * ordinary bad luck common rather than a rare, funny outlier.
 */
export function getInitialWalletPoints(rounds: number) {
  return (rounds * (rounds + 1)) / 2 + 5
}

/**
 * Resolves every bet placed on a finished match: correct predictions earn
 * back double their stake (net profit equal to the stake), wrong ones earn
 * nothing (the staked points, already spent at placement, stay lost). Must
 * run inside the same transaction that sets the match's winner.
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
    const pointsEarned = won ? bet.pointsSpent * 2 : 0

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

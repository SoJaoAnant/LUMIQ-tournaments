"use server"

import { revalidatePath } from "next/cache"

import { getCurrentUser, ForbiddenError } from "@/lib/auth"
import { db } from "@/lib/db"
import { revalidateTournamentPaths } from "@/lib/revalidate"

export async function placeBet(matchId: string, predictedWinnerId: string) {
  const user = await getCurrentUser()
  if (!user) throw new ForbiddenError("You must be signed in to place a bet.")

  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } })

  if (match.status !== "BETTING_OPEN") {
    throw new ForbiddenError("Betting isn't open for this match.")
  }
  if (predictedWinnerId !== match.player1Id && predictedWinnerId !== match.player2Id) {
    throw new ForbiddenError("You can only bet on one of the two players in this match.")
  }

  const existing = await db.bet.findUnique({
    where: { userId_matchId: { userId: user.id, matchId } },
  })
  if (existing) throw new ForbiddenError("You've already placed a bet on this match.")

  const wallet = await db.tournamentWallet.findUnique({
    where: { userId_tournamentId: { userId: user.id, tournamentId: match.tournamentId } },
  })
  if (!wallet || wallet.currentPoints < 1) {
    throw new ForbiddenError("You don't have enough betting points left.")
  }

  await db.$transaction([
    db.bet.create({
      data: { userId: user.id, matchId, predictedWinnerId, pointsSpent: 1, pointsEarned: 0 },
    }),
    db.tournamentWallet.update({
      where: { id: wallet.id },
      data: { currentPoints: { decrement: 1 } },
    }),
  ])

  revalidateTournamentPaths(match.tournamentId)
  revalidatePath("/profile")
}

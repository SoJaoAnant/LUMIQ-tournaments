import { notFound } from "next/navigation"
import { Trophy } from "lucide-react"

import { getTournament } from "@/lib/data/tournaments"
import { db } from "@/lib/db"
import { getSupportLeaderboard } from "@/lib/data/leaderboard"
import { EmptyState } from "@/components/shared/empty-state"
import { WinnersPodium } from "@/components/results/winners-podium"
import { BestSupporterCard } from "@/components/results/best-supporter-card"

export default async function TournamentResultsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  if (tournament.status !== "COMPLETED" && tournament.status !== "ARCHIVED") {
    return (
      <EmptyState
        icon={Trophy}
        title="Results aren't in yet"
        description="Check back once every match — including the bronze match, if there is one — has finished."
      />
    )
  }

  const participantIds = [
    tournament.winnerParticipantId,
    tournament.runnerUpParticipantId,
    tournament.thirdPlaceParticipantId,
  ].filter((v): v is string => !!v)

  const [participants, leaderboard] = await Promise.all([
    participantIds.length
      ? db.participant.findMany({
          where: { id: { in: participantIds } },
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
    getSupportLeaderboard(id),
  ])

  const nameById = new Map(participants.map((p) => [p.id, p.user.name]))
  const bestSupporter = leaderboard.find((row) => row.userId === tournament.bestSupporterId)

  return (
    <div className="flex flex-col items-center gap-8">
      <WinnersPodium
        winner={tournament.winnerParticipantId ? nameById.get(tournament.winnerParticipantId) ?? null : null}
        runnerUp={
          tournament.runnerUpParticipantId ? nameById.get(tournament.runnerUpParticipantId) ?? null : null
        }
        thirdPlace={
          tournament.thirdPlaceParticipantId
            ? nameById.get(tournament.thirdPlaceParticipantId) ?? null
            : null
        }
      />

      <div className="w-full max-w-xl">
        <BestSupporterCard
          name={bestSupporter?.name ?? null}
          points={bestSupporter?.points ?? null}
          accuracy={bestSupporter?.accuracy ?? null}
        />
      </div>
    </div>
  )
}

import { Trophy } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { EmptyState } from "@/components/shared/empty-state"
import { TournamentCard } from "@/components/tournament/tournament-card"

export default async function TournamentsPage() {
  const user = await requireUser()

  const [tournaments, myParticipations] = await Promise.all([
    db.tournament.findMany({
      where: { status: { not: "DRAFT" } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { participants: true } } },
    }),
    db.participant.findMany({ where: { userId: user.id }, select: { tournamentId: true } }),
  ])

  const joinedIds = new Set(myParticipations.map((p) => p.tournamentId))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tournaments</h1>
        <p className="text-sm text-muted-foreground">Browse and join upcoming tournaments.</p>
      </div>

      {tournaments.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No tournaments yet"
          description="Check back once an admin creates one."
        />
      ) : (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              participantCount={t._count.participants}
              isParticipant={joinedIds.has(t.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

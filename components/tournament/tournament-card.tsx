import Link from "next/link"
import { Users } from "lucide-react"
import type { Tournament } from "@prisma/client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { TournamentStatusBadge } from "@/components/tournament/status-badge"
import { JoinLeaveButton } from "@/components/tournament/join-leave-button"

export function TournamentCard({
  tournament,
  participantCount,
  isParticipant,
}: {
  tournament: Tournament
  participantCount: number
  isParticipant: boolean
}) {
  return (
    <Card className="relative flex flex-col transition-colors hover:border-primary/40">
      <Link
        href={`/tournaments/${tournament.id}`}
        className="absolute inset-0 z-0 rounded-[inherit]"
      >
        <span className="sr-only">View {tournament.title}</span>
      </Link>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">{tournament.title}</CardTitle>
          <TournamentStatusBadge status={tournament.status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {tournament.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{tournament.description}</p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {participantCount} joined
        </div>
      </CardContent>
      <CardFooter className="relative z-10 flex gap-2">
        <JoinLeaveButton tournament={tournament} isParticipant={isParticipant} />
      </CardFooter>
    </Card>
  )
}

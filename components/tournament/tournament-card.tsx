import Link from "next/link"
import { Users } from "lucide-react"
import type { Tournament } from "@prisma/client"

import { Button } from "@/components/ui/button"
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
    <Card className="flex flex-col">
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
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          render={<Link href={`/tournaments/${tournament.id}`} />}
          nativeButton={false}
        >
          View
        </Button>
        <JoinLeaveButton tournament={tournament} isParticipant={isParticipant} />
      </CardFooter>
    </Card>
  )
}

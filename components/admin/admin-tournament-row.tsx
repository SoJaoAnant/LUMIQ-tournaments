"use client"

import { useRouter } from "next/navigation"
import type { Tournament } from "@prisma/client"

import { TableCell, TableRow } from "@/components/ui/table"
import { TournamentStatusBadge } from "@/components/tournament/status-badge"
import { TournamentRowActions } from "@/components/admin/tournament-row-actions"

export function AdminTournamentRow({
  tournament,
  participantCount,
}: {
  tournament: Tournament
  participantCount: number
}) {
  const router = useRouter()

  return (
    <TableRow
      className="cursor-pointer"
      onClick={() => router.push(`/tournaments/${tournament.id}/manage`)}
    >
      <TableCell className="font-medium">{tournament.title}</TableCell>
      <TableCell>
        <TournamentStatusBadge status={tournament.status} />
      </TableCell>
      <TableCell>{participantCount}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {tournament.registrationOpen.toLocaleDateString()} –{" "}
        {tournament.registrationClose.toLocaleDateString()}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <TournamentRowActions tournamentId={tournament.id} />
      </TableCell>
    </TableRow>
  )
}

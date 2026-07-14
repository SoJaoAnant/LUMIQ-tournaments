import { Trophy } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { TournamentStatusBadge } from "@/components/tournament/status-badge"
import { TournamentRowActions } from "@/components/admin/tournament-row-actions"
import { ResetTournamentButton } from "@/components/developer/reset-tournament-button"

export default async function DeveloperTournamentsPage() {
  await requireRole("DEVELOPER")

  const tournaments = await db.tournament.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Trophy className="size-6 text-primary" />
          Tournaments
        </h1>
        <p className="text-sm text-muted-foreground">
          Reset wipes bracket progress; delete removes the tournament entirely.
        </p>
      </div>

      {tournaments.length === 0 ? (
        <EmptyState icon={Trophy} title="No tournaments yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-56" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tournaments.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.title}</TableCell>
                <TableCell>
                  <TournamentStatusBadge status={t.status} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {t.status !== "DRAFT" && t.status !== "REGISTRATION_OPEN" && (
                      <ResetTournamentButton tournamentId={t.id} />
                    )}
                    <TournamentRowActions tournamentId={t.id} status={t.status} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

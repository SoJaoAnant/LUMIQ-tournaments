import { notFound } from "next/navigation"
import { Users } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { ImportParticipantsDialog } from "@/components/admin/import-participants-dialog"
import { RemoveParticipantButton } from "@/components/admin/remove-participant-button"
import { DisqualifyParticipantButton } from "@/components/admin/disqualify-participant-button"

export default async function AdminParticipantsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  const participants = await db.participant.findMany({
    where: { tournamentId: id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { seed: "asc" },
  })

  const canRemove = tournament.status === "DRAFT" || tournament.status === "REGISTRATION_OPEN"
  const canDisqualify =
    tournament.status === "BRACKET_GENERATED" || tournament.status === "IN_PROGRESS"

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Participants ({participants.length})</h2>
        {canRemove && <ImportParticipantsDialog tournamentId={id} />}
      </div>

      {participants.length === 0 ? (
        <EmptyState icon={Users} title="No participants yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Seed</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              {(canRemove || canDisqualify) && <TableHead className="w-10" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {participants.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.seed || "—"}</TableCell>
                <TableCell className="font-medium">{p.user.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.user.email}</TableCell>
                <TableCell>
                  {p.eliminated ? (
                    <Badge variant="destructive">Eliminated</Badge>
                  ) : (
                    <Badge className="bg-primary text-primary-foreground">Active</Badge>
                  )}
                </TableCell>
                {(canRemove || canDisqualify) && (
                  <TableCell>
                    {canRemove && (
                      <RemoveParticipantButton tournamentId={id} participantId={p.id} />
                    )}
                    {canDisqualify && !p.eliminated && (
                      <DisqualifyParticipantButton
                        tournamentId={id}
                        participantId={p.id}
                        participantName={p.user.name}
                      />
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

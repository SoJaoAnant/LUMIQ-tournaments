import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { TournamentForm } from "@/components/admin/tournament-form"
import { RegistrationToggle } from "@/components/admin/registration-toggle"

export default async function EditTournamentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  return (
    <div className="flex flex-col gap-6">
      {(tournament.status === "DRAFT" || tournament.status === "REGISTRATION_OPEN") && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            {tournament.status === "DRAFT"
              ? "Registration hasn't opened yet."
              : "Registration is open for new participants."}
          </p>
          <RegistrationToggle tournamentId={id} status={tournament.status} />
        </div>
      )}
      <TournamentForm tournament={tournament} />
    </div>
  )
}

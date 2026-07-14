import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { TournamentForm } from "@/components/admin/tournament-form"

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
      <TournamentForm tournament={tournament} />
    </div>
  )
}

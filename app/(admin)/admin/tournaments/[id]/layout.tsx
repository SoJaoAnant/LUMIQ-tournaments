import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { TournamentStatusBadge } from "@/components/tournament/status-badge"
import { AdminTournamentTabs } from "@/components/admin/admin-tournament-tabs"
import { TournamentLifecycleStepper } from "@/components/admin/tournament-lifecycle-stepper"

export default async function AdminTournamentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/tournaments"
          className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          All Tournaments
        </Link>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{tournament.title}</h1>
          <TournamentStatusBadge status={tournament.status} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/60 px-4 py-4 sm:px-6">
        <TournamentLifecycleStepper status={tournament.status} />
      </div>

      <AdminTournamentTabs tournamentId={id} />

      {children}
    </div>
  )
}

import { notFound } from "next/navigation"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { getBracketData } from "@/lib/data/bracket"
import { BracketView } from "@/components/bracket/bracket-view"
import { GenerateBracketButton } from "@/components/admin/generate-bracket-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default async function AdminBracketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  const participantCount = await db.participant.count({ where: { tournamentId: id } })
  const { matches, players } = await getBracketData(id)

  return (
    <div className="flex flex-col gap-4">
      {tournament.status === "REGISTRATION_CLOSED" && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            Registration is closed with {participantCount} participants. Ready to generate the
            bracket.
          </p>
          <GenerateBracketButton tournamentId={id} participantCount={participantCount} />
        </div>
      )}

      {tournament.status === "REGISTRATION_OPEN" && (
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Registration is still open</AlertTitle>
          <AlertDescription>
            Close registration before the bracket can be generated.
          </AlertDescription>
        </Alert>
      )}

      <BracketView matches={matches} players={players} />
    </div>
  )
}

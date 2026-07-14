import { requireRole } from "@/lib/auth"
import { TournamentForm } from "@/components/admin/tournament-form"

export default async function NewTournamentPage() {
  await requireRole("ADMIN")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Tournament</h1>
        <p className="text-sm text-muted-foreground">
          Set the registration window — you can generate the bracket once it closes.
        </p>
      </div>
      <TournamentForm />
    </div>
  )
}

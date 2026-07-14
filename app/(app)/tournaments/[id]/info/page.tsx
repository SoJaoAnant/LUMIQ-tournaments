import { notFound } from "next/navigation"
import { Users } from "lucide-react"

import { getTournament } from "@/lib/data/tournaments"
import { db } from "@/lib/db"
import { computeRounds } from "@/lib/bracket"
import { getInitialWalletPoints } from "@/lib/betting"
import { AvatarTile } from "@/components/shared/avatar-tile"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"

export default async function TournamentInfoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const participants = await db.participant.findMany({
    where: { tournamentId: id },
    include: { user: { select: { name: true, department: true } } },
    orderBy: { seed: "asc" },
  })

  const rounds = participants.length > 0 ? computeRounds(participants.length) : null
  const initialPoints = rounds !== null ? getInitialWalletPoints(rounds) : null

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-base font-bold">Tournament rules</h2>
          <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
            {[
              "Single-elimination bracket — lose once and you're out (except the bronze match).",
              "Once registration closes, participants are randomly shuffled and paired into round 1.",
              "If the field isn't a power of two, some players get a bye and auto-advance a round.",
              "The two semifinal losers play a bronze match to decide 3rd place.",
            ].map((rule, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 font-heading text-base font-bold">Betting rules</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            <li>• One bet per match — you can&apos;t back both players.</li>
            <li>• Bets can&apos;t be edited or cancelled once submitted.</li>
            <li>• Betting automatically locks the moment a match goes live.</li>
            <li>• Your full betting history stays visible, win or lose.</li>
            <li>
              • You start with enough points to bet every round and lose every time, plus a small
              cushion
              {initialPoints !== null && (
                <>
                  {" "}
                  — for this cup&apos;s current {participants.length} players ({rounds} rounds),
                  that&apos;s <strong className="text-foreground">{initialPoints} points</strong>{" "}
                  (1+2+...+{rounds} plus 5)
                </>
              )}
              . Stakes rise with the round — 1 point in round 1, 2 in round 2, and so on. Correct
              picks return double the stake; wrong ones lose it, even into negative points.
            </li>
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold">
          <Users className="size-4 text-primary" />
          Participants
        </h2>
        {participants.length === 0 ? (
          <EmptyState icon={Users} title="No participants yet" />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {participants.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <AvatarTile name={p.user.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.user.name}</p>
                  {p.user.department && (
                    <p className="text-xs text-muted-foreground">{p.user.department}</p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">Seed #{p.seed}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    p.eliminated ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  )}
                >
                  {p.eliminated ? "Eliminated" : "Active"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

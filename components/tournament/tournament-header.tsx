import { TournamentIconTile } from "@/components/tournament/tournament-icon-tile"
import type { TournamentStage } from "@/lib/data/bracket"
import { cn } from "@/lib/utils"

export function TournamentHeader({
  id,
  title,
  participantCount,
  stage,
}: {
  id: string
  title: string
  participantCount: number
  stage: TournamentStage | null
}) {
  const pulsing = stage?.live || stage?.bettingOpen

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <TournamentIconTile id={id} />
        <div>
          <h1 className="font-heading text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          <p className="text-sm text-muted-foreground">
            {participantCount} player{participantCount === 1 ? "" : "s"} · Single elimination
          </p>
        </div>
      </div>

      {stage && (
        <div
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold",
            pulsing ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          )}
        >
          {pulsing && <span className="inline-flex size-2 rounded-full bg-destructive" />}
          <span>
            {stage.roundLabel}
            {stage.bettingOpen && " · Betting open"}
            {stage.live && " · Live"}
            {stage.concluded && " · Concluded"}
          </span>
        </div>
      )}
    </div>
  )
}

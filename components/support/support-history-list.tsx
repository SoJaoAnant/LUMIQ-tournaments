import { getRoundLabel } from "@/lib/bracket"
import { cn } from "@/lib/utils"

export type SupportHistoryRow = {
  id: string
  matchRound: number
  matchNumber: number
  predictedWinnerName: string
  won: boolean | null
  pointsEarned: number
  pointsSpent: number
}

export function SupportHistoryList({
  support,
  totalRounds,
}: {
  support: SupportHistoryRow[]
  totalRounds: number
}) {
  if (support.length === 0) {
    return <p className="text-sm text-muted-foreground">No support given yet in this tournament.</p>
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {support.map((b) => (
        <li key={b.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              {getRoundLabel(b.matchRound, totalRounds)} · Match {b.matchNumber}
            </p>
            <p className="truncate text-sm font-semibold">Backed {b.predictedWinnerName}</p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold",
              b.won === null && "bg-primary/10 text-primary",
              b.won === true && "bg-[#3FBF87]/12 text-[#2C9E6E]",
              b.won === false && "bg-destructive/10 text-destructive"
            )}
          >
            {b.won === null ? "Pending" : b.won ? `Won +${b.pointsEarned}` : `Missed −${b.pointsSpent}`}
          </span>
        </li>
      ))}
    </ul>
  )
}

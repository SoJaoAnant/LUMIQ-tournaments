import { cn } from "@/lib/utils"

const MEDAL_CLASS = [
  "bg-[radial-gradient(circle_at_35%_30%,#fde68a,#f5c542_68%,#c8971f)] text-amber-950",
  "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-700",
  "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950",
]

export function RankBadge({ rank }: { rank: number }) {
  if (rank > 3) {
    return (
      <span className="grid size-7 shrink-0 place-items-center text-sm font-bold text-muted-foreground">
        {rank}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold shadow-sm",
        MEDAL_CLASS[rank - 1]
      )}
    >
      {rank}
    </span>
  )
}

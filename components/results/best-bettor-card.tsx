import { Sparkles, Target, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

export function BestBettorCard({
  name,
  points,
  accuracy,
}: {
  name: string | null
  points: number | null
  accuracy: number | null
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl p-6 text-white shadow-lg shadow-primary/20 sm:p-8",
        "bg-[linear-gradient(120deg,#898CEC,#E583BA)]"
      )}
    >
      <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 size-40 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center gap-2 text-sm font-medium text-white/80">
        <Sparkles className="size-4" />
        Best Bettor of the Tournament
      </div>

      {name ? (
        <div className="relative mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className="font-heading text-2xl font-bold sm:text-3xl">{name}</p>
          <div className="flex gap-5">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <TrendingUp className="size-3.5" />
                Points
              </div>
              <p className="font-heading text-xl font-bold">{points}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs text-white/70">
                <Target className="size-3.5" />
                Accuracy
              </div>
              <p className="font-heading text-xl font-bold">{accuracy}%</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="relative mt-4 text-sm text-white/85">No betting activity this tournament.</p>
      )}
    </div>
  )
}

import { Sparkles, Target, TrendingUp } from "lucide-react"

import { cn } from "@/lib/utils"

export function BestSupporterCard({
  name,
  points,
  accuracy,
}: {
  name: string | null
  points: number | null
  accuracy: number | null
}) {
  return (
    <div className={cn("rounded-3xl bg-primary p-6 text-white sm:p-8")}>
      <div className="flex items-center gap-2 text-sm font-medium text-white/80">
        <Sparkles className="size-4" />
        Best Supporter of the Tournament
      </div>

      {name ? (
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
        <p className="mt-4 text-sm text-white/85">No support activity this tournament.</p>
      )}
    </div>
  )
}

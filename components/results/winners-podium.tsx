import { Crown, Medal, Trophy } from "lucide-react"

import { cn } from "@/lib/utils"

type Podium = {
  winner: string | null
  runnerUp: string | null
  thirdPlace: string | null
}

function initials(name: string | null) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const PLACES = [
  {
    label: "2nd",
    key: "runnerUp" as const,
    height: "h-28",
    icon: Medal,
    order: "order-1",
    ring: "ring-zinc-300 dark:ring-zinc-600",
    avatarBg: "bg-gradient-to-br from-zinc-200 to-zinc-400 text-zinc-700",
    blockBg: "bg-gradient-to-t from-zinc-200/70 to-zinc-100/40 dark:from-zinc-700/40 dark:to-zinc-800/20",
    labelColor: "text-zinc-500",
    iconColor: "text-zinc-400",
  },
  {
    label: "1st",
    key: "winner" as const,
    height: "h-40",
    icon: Trophy,
    order: "order-2",
    ring: "ring-amber-300 dark:ring-amber-500/60",
    avatarBg: "bg-[radial-gradient(circle_at_35%_30%,#fde68a,#f5c542_60%,#c8971f)] text-amber-950",
    blockBg: "bg-gradient-to-t from-amber-200/70 to-amber-50/40 dark:from-amber-500/20 dark:to-amber-500/5",
    labelColor: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-500",
  },
  {
    label: "3rd",
    key: "thirdPlace" as const,
    height: "h-20",
    icon: Medal,
    order: "order-3",
    ring: "ring-orange-300 dark:ring-orange-700/60",
    avatarBg: "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950",
    blockBg: "bg-gradient-to-t from-orange-200/60 to-orange-50/30 dark:from-orange-800/30 dark:to-orange-900/10",
    labelColor: "text-orange-600 dark:text-orange-400",
    iconColor: "text-orange-500",
  },
]

export function WinnersPodium({ winner, runnerUp, thirdPlace }: Podium) {
  const names = { winner, runnerUp, thirdPlace }

  return (
    <div className="flex items-end justify-center gap-3 pt-8 sm:gap-6">
      {PLACES.map((place) => {
        const Icon = place.icon
        const name = names[place.key]
        const isChampion = place.label === "1st"

        return (
          <div key={place.label} className={cn("flex w-24 flex-col items-center gap-3 sm:w-32", place.order)}>
            <div className="relative flex flex-col items-center gap-2">
              {isChampion && (
                <Crown className="absolute -top-7 size-6 -rotate-6 text-amber-400" />
              )}
              <div
                className={cn(
                  "grid size-14 shrink-0 place-items-center rounded-full font-heading text-lg font-bold shadow-md ring-4 sm:size-16",
                  place.avatarBg,
                  place.ring
                )}
              >
                {initials(name)}
              </div>
              <p className="max-w-full truncate text-center text-sm font-medium">{name ?? "—"}</p>
            </div>

            <div
              className={cn(
                "flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl border border-b-0 border-border/60 pt-3 shadow-inner",
                place.height,
                place.blockBg
              )}
            >
              <Icon className={cn("size-6", place.iconColor)} />
              <span className={cn("font-heading text-xl font-extrabold", place.labelColor)}>
                {place.label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

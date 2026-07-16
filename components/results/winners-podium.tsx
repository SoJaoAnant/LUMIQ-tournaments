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
    border: "border-zinc-300 dark:border-zinc-600",
    avatarBg: "bg-zinc-300 text-zinc-700",
    blockBg: "bg-zinc-100 dark:bg-zinc-800/40",
    labelColor: "text-zinc-500",
    iconColor: "text-zinc-400",
  },
  {
    label: "1st",
    key: "winner" as const,
    height: "h-40",
    icon: Trophy,
    order: "order-2",
    border: "border-amber-400 dark:border-amber-500/60",
    avatarBg: "bg-amber-400 text-amber-950",
    blockBg: "bg-amber-100 dark:bg-amber-500/10",
    labelColor: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-500",
  },
  {
    label: "3rd",
    key: "thirdPlace" as const,
    height: "h-20",
    icon: Medal,
    order: "order-3",
    border: "border-orange-400 dark:border-orange-700/60",
    avatarBg: "bg-orange-400 text-orange-950",
    blockBg: "bg-orange-100 dark:bg-orange-900/20",
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
                  "grid size-14 shrink-0 place-items-center rounded-full border-2 font-heading text-lg font-bold sm:size-16",
                  place.avatarBg,
                  place.border
                )}
              >
                {initials(name)}
              </div>
              <p className="max-w-full truncate text-center text-sm font-medium">{name ?? "—"}</p>
            </div>

            <div
              className={cn(
                "flex w-full flex-col items-center justify-start gap-1 rounded-t-2xl border border-b-0 border-border/60 pt-3",
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

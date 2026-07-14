"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

export function LeaderboardToggle({
  bettors,
  players,
}: {
  bettors: React.ReactNode
  players: React.ReactNode
}) {
  const [tab, setTab] = useState<"bettors" | "players">("bettors")

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-full bg-muted p-1">
        {(["bettors", "players"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition-colors",
              tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "bettors" ? bettors : players}
    </div>
  )
}

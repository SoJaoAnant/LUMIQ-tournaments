"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function TournamentTabs({
  tournamentId,
  bettingOpen = false,
}: {
  tournamentId: string
  bettingOpen?: boolean
}) {
  const pathname = usePathname()
  const base = `/tournaments/${tournamentId}`

  const tabs = [
    { label: "Overview", href: base },
    { label: "Bracket", href: `${base}/bracket` },
    { label: "Betting", href: `${base}/betting`, dot: bettingOpen },
    { label: "Leaderboard", href: `${base}/leaderboard` },
    { label: "Info", href: `${base}/info` },
  ]

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <nav className="flex w-max min-w-full gap-1.5 sm:w-full">
        {tabs.map((tab) => {
          const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "border-transparent bg-gradient-to-br from-primary to-[#7A7DE8] text-primary-foreground shadow-sm shadow-primary/25"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              {tab.dot && (
                <span className={cn("size-1.5 rounded-full", active ? "bg-white" : "bg-destructive")} />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

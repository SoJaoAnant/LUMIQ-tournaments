"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

export function AdminTournamentTabs({ tournamentId }: { tournamentId: string }) {
  const pathname = usePathname()
  const base = `/admin/tournaments/${tournamentId}`

  const tabs = [
    { label: "Edit", href: `${base}/edit` },
    { label: "Participants", href: `${base}/participants` },
    { label: "Bracket", href: `${base}/bracket` },
    { label: "Matches", href: `${base}/matches` },
    { label: "Betting Stats", href: `${base}/betting` },
    { label: "Export", href: `${base}/export` },
  ]

  return (
    <div className="-mx-4 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      <nav className="flex w-max min-w-full gap-1 sm:w-full">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

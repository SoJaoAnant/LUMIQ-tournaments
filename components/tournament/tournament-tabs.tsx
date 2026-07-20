"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Wrench } from "lucide-react"

import { cn } from "@/lib/utils"

export function TournamentTabs({
  tournamentId,
  supportOpen = false,
  canManage = false,
}: {
  tournamentId: string
  supportOpen?: boolean
  /** Shows the admin-only "Manage" tab (edit, participants, bracket setup, stats). */
  canManage?: boolean
}) {
  const pathname = usePathname()
  const base = `/tournaments/${tournamentId}`

  const tabs = [
    { label: "Overview", href: base },
    { label: "Bracket", href: `${base}/bracket` },
    { label: "Support", href: `${base}/support`, dot: supportOpen },
    { label: "Leaderboard", href: `${base}/leaderboard` },
    // "Info" tab intentionally hidden, not deleted — the /info route/page still exists in case it's needed again.
    ...(canManage ? [{ label: "Manage", href: `${base}/manage`, icon: Wrench }] : []),
  ]

  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <nav className="flex w-max min-w-full gap-1.5 sm:w-full">
        {tabs.map((tab) => {
          const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href)
          const Icon = "icon" in tab ? tab.icon : undefined
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                active
                  ? "border-transparent bg-gradient-to-br from-primary to-[#E17B32] text-primary-foreground shadow-sm shadow-primary/25"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              {Icon && <Icon className="size-3.5" />}
              {tab.label}
              {"dot" in tab && tab.dot && (
                <span className={cn("size-1.5 rounded-full", active ? "bg-white" : "bg-destructive")} />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Role } from "@prisma/client"

import { NAV_ITEMS } from "@/components/layout/nav-items"
import { hasAtLeastRole } from "@/lib/rbac"
import { cn } from "@/lib/utils"

export function NavLinks({
  role,
  onNavigate,
  className,
}: {
  role: Role
  onNavigate?: () => void
  className?: string
}) {
  const pathname = usePathname()
  const visibleItems = NAV_ITEMS.filter((item) => hasAtLeastRole(role, item.minRole))

  // When multiple items' hrefs match (e.g. /admin and /admin/tournaments both
  // prefix-match /admin/tournaments/123), only the most specific one should highlight.
  const matching = visibleItems.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )
  const bestMatch = matching.sort((a, b) => b.href.length - a.href.length)[0]

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {visibleItems.map((item) => {
        const active = item.href === bestMatch?.href
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

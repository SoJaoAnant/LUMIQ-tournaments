import Link from "next/link"
import { Flag, ScrollText, ShieldCheck, Terminal, Trophy } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DeveloperOverviewPage() {
  const user = await requireRole("DEVELOPER")

  const [adminCount, auditLogCount, flagCount, tournamentCount] = await Promise.all([
    db.user.count({ where: { role: { in: ["ADMIN", "DEVELOPER"] } } }),
    db.auditLog.count(),
    db.featureFlag.count(),
    db.tournament.count(),
  ])

  const cards = [
    { href: "/developer/admins", icon: ShieldCheck, label: "Admins & Developers", value: adminCount },
    { href: "/developer/audit-logs", icon: ScrollText, label: "Audit Log Entries", value: auditLogCount },
    { href: "/developer/feature-flags", icon: Flag, label: "Feature Flags", value: flagCount },
    { href: "/developer/tournaments", icon: Trophy, label: "Tournaments", value: tournamentCount },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Terminal className="size-6 text-primary" />
          Developer Console
        </h1>
        <p className="text-sm text-muted-foreground">Signed in as {user.name} ({user.role}).</p>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <Link key={card.href} href={card.href} className="min-w-0">
              <Card className="min-w-0 transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="size-4 text-primary" />
                    {card.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-3xl font-semibold">{card.value}</CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

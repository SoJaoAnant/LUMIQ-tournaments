import Link from "next/link"
import { Plus, ShieldCheck, Trophy, Users } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminOverviewPage() {
  const user = await requireRole("ADMIN")

  const [tournamentCount, userCount] = await Promise.all([
    db.tournament.count(),
    db.user.count(),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <ShieldCheck className="size-6 text-primary" />
            Admin Console
          </h1>
          <p className="text-sm text-muted-foreground">Signed in as {user.name} ({user.role}).</p>
        </div>
        <Button render={<Link href="/admin/tournaments/new" />} nativeButton={false}>
          <Plus className="size-4" />
          New Tournament
        </Button>
      </div>

      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Link href="/admin/tournaments" className="min-w-0">
          <Card className="min-w-0 transition-colors hover:bg-muted/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4 text-primary" />
                Tournaments
              </CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-semibold">{tournamentCount}</CardContent>
          </Card>
        </Link>
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4 text-primary" />
              Registered Users
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{userCount}</CardContent>
        </Card>
      </div>
    </div>
  )
}

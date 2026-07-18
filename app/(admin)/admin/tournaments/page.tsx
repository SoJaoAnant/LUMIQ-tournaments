import Link from "next/link"
import { Plus, Trophy } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { AdminTournamentRow } from "@/components/admin/admin-tournament-row"

export default async function AdminTournamentsPage() {
  await requireRole("ADMIN")

  const tournaments = await db.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: { where: { isPlayer: true } } } } },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tournaments</h1>
          <p className="text-sm text-muted-foreground">Create and manage tournaments.</p>
        </div>
        <Button render={<Link href="/admin/tournaments/new" />} nativeButton={false}>
          <Plus className="size-4" />
          New Tournament
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Tournaments</CardTitle>
        </CardHeader>
        <CardContent>
          {tournaments.length === 0 ? (
            <EmptyState
              icon={Trophy}
              title="No tournaments yet"
              description="Create your first tournament to get started."
              action={
                <Button render={<Link href="/admin/tournaments/new" />} nativeButton={false}>
                  New Tournament
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Registration Window</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((t) => (
                  <AdminTournamentRow key={t.id} tournament={t} participantCount={t._count.participants} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

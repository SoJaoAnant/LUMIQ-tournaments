import { UserRound } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"

export default async function ProfilePage() {
  const user = await requireUser()

  const support = await db.support.findMany({
    where: { userId: user.id },
    include: { match: { include: { tournament: true } } },
    orderBy: { lockedAt: "desc" },
    take: 25,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">Your account and support history.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserRound className="size-4 text-primary" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="grid min-w-0 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="truncate font-medium">{user.name}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Email</p>
            <p className="truncate font-medium">{user.email}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Department</p>
            <p className="truncate font-medium">{user.department ?? "—"}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Role</p>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Support History</CardTitle>
        </CardHeader>
        <CardContent>
          {support.length === 0 ? (
            <EmptyState
              icon={UserRound}
              title="No support given yet"
              description="Your support across every tournament will show up here, including ones you've lost."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Round / Match</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {support.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.match.tournament.title}</TableCell>
                    <TableCell>
                      R{s.match.round} · #{s.match.matchNumber}
                    </TableCell>
                    <TableCell>
                      {s.won === null ? (
                        <Badge variant="outline">Pending</Badge>
                      ) : s.won ? (
                        <Badge className="bg-primary text-primary-foreground">Won</Badge>
                      ) : (
                        <Badge variant="destructive">Lost</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.won === null ? "—" : s.won ? `+${s.pointsEarned}` : `-${s.pointsSpent}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import Link from "next/link"
import { Megaphone, Swords, Trophy } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/shared/empty-state"
import { TournamentStatusBadge } from "@/components/tournament/status-badge"

export default async function DashboardPage() {
  const user = await requireUser()

  const participations = await db.participant.findMany({
    where: { userId: user.id },
    include: { tournament: true },
    orderBy: { tournament: { createdAt: "desc" } },
    take: 6,
  })

  const tournamentIds = participations.map((p) => p.tournamentId)

  const [openBets, announcements] = await Promise.all([
    tournamentIds.length
      ? db.match.findMany({
          where: {
            tournamentId: { in: tournamentIds },
            status: "BETTING_OPEN",
            bets: { none: { userId: user.id } },
          },
          include: { tournament: true },
          take: 5,
        })
      : Promise.resolve([]),
    tournamentIds.length
      ? db.announcement.findMany({
          where: { tournamentId: { in: tournamentIds } },
          include: { tournament: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome, {user.name}</h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening across your tournaments.
        </p>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="size-4 text-primary" />
              My Tournaments
            </CardTitle>
            <Button
              render={<Link href="/tournaments" />}
              nativeButton={false}
              variant="ghost"
              size="sm"
            >
              Browse all
            </Button>
          </CardHeader>
          <CardContent>
            {participations.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="You haven't joined any tournaments yet"
                description="Browse open tournaments and register before the window closes."
                action={
                  <Button render={<Link href="/tournaments" />} nativeButton={false}>
                    Browse tournaments
                  </Button>
                }
              />
            ) : (
              <ul className="flex flex-col gap-2">
                {participations.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/tournaments/${p.tournamentId}`}
                      className="flex items-center justify-between rounded-xl border border-border p-3 transition-colors hover:bg-muted"
                    >
                      <div>
                        <p className="font-medium">{p.tournament.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Seed #{p.seed} · {p.eliminated ? "Eliminated" : "Active"}
                        </p>
                      </div>
                      <TournamentStatusBadge status={p.tournament.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords className="size-4 text-primary" />
              Open Betting Windows
            </CardTitle>
          </CardHeader>
          <CardContent>
            {openBets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open bets right now.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {openBets.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={`/tournaments/${m.tournamentId}/betting`}
                      className="block rounded-xl border border-border p-3 text-sm transition-colors hover:bg-muted"
                    >
                      <p className="font-medium">{m.tournament.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Round {m.round} · Match #{m.matchNumber}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Megaphone className="size-4 text-primary" />
            Recent Announcements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No announcements from your tournaments yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {announcements.map((a) => (
                <li key={a.id} className="rounded-xl border border-border p-3">
                  <p className="text-xs font-medium text-primary">{a.tournament.title}</p>
                  <p className="font-medium">{a.title}</p>
                  <p className="text-sm text-muted-foreground">{a.content}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

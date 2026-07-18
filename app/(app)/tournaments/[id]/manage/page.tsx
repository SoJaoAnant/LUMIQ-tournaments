import { notFound } from "next/navigation"
import { BarChart3, Download, Users } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { getBracketData } from "@/lib/data/bracket"
import { getRoundLabel } from "@/lib/bracket"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"
import { TournamentLifecycleStepper } from "@/components/admin/tournament-lifecycle-stepper"
import { RegistrationToggle } from "@/components/admin/registration-toggle"
import { TournamentForm } from "@/components/admin/tournament-form"
import { ImportParticipantsDialog } from "@/components/admin/import-participants-dialog"
import { RemoveParticipantButton } from "@/components/admin/remove-participant-button"
import { DisqualifyParticipantButton } from "@/components/admin/disqualify-participant-button"
import { ResetTournamentButton } from "@/components/developer/reset-tournament-button"

export default async function TournamentManagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = await requireRole("ADMIN", `/tournaments/${id}`)

  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  const [participants, { matches, players }, support] = await Promise.all([
    db.participant.findMany({
      where: { tournamentId: id },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { seed: "asc" },
    }),
    getBracketData(id),
    db.support.findMany({ where: { match: { tournamentId: id } } }),
  ])

  const playerCount = participants.filter((p) => p.isPlayer).length
  const supporterCount = participants.length - playerCount

  const canRemove = tournament.status === "DRAFT" || tournament.status === "REGISTRATION_OPEN"
  const canDisqualify =
    tournament.status === "BRACKET_GENERATED" || tournament.status === "IN_PROGRESS"

  const totalRounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0
  const supportByMatch = new Map<string, typeof support>()
  support.forEach((s) => {
    supportByMatch.set(s.matchId, [...(supportByMatch.get(s.matchId) ?? []), s])
  })
  const matchesWithSupport = matches
    .filter((m) => supportByMatch.has(m.id))
    .sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber)

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border bg-card/60 px-4 py-4 sm:px-6">
        <TournamentLifecycleStepper status={tournament.status} />
      </div>

      {(tournament.status === "DRAFT" || tournament.status === "REGISTRATION_OPEN") && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            {tournament.status === "DRAFT"
              ? "Registration hasn't opened yet."
              : "Registration is open for new participants."}
          </p>
          <RegistrationToggle tournamentId={id} status={tournament.status} />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <TournamentForm tournament={tournament} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" />
            Participants ({playerCount} player{playerCount === 1 ? "" : "s"}
            {supporterCount > 0 ? `, ${supporterCount} supporter${supporterCount === 1 ? "" : "s"}` : ""})
          </CardTitle>
          {canRemove && <ImportParticipantsDialog tournamentId={id} />}
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <EmptyState icon={Users} title="No participants yet" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seed</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  {(canRemove || canDisqualify) && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.isPlayer ? p.seed || "—" : "—"}</TableCell>
                    <TableCell className="font-medium">{p.user.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.user.email}</TableCell>
                    <TableCell>
                      <Badge variant={p.isPlayer ? "default" : "secondary"}>
                        {p.isPlayer ? "Player" : "Supporter"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!p.isPlayer ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : p.eliminated ? (
                        <Badge variant="destructive">Eliminated</Badge>
                      ) : (
                        <Badge className="bg-primary text-primary-foreground">Active</Badge>
                      )}
                    </TableCell>
                    {(canRemove || canDisqualify) && (
                      <TableCell>
                        {canRemove && (
                          <RemoveParticipantButton tournamentId={id} participantId={p.id} />
                        )}
                        {canDisqualify && p.isPlayer && !p.eliminated && (
                          <DisqualifyParticipantButton
                            tournamentId={id}
                            participantId={p.id}
                            participantName={p.user.name}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" />
            Support Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid min-w-0 gap-4 sm:grid-cols-3">
            <div className="min-w-0 rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Total Support</p>
              <p className="text-2xl font-semibold">{support.length}</p>
            </div>
            <div className="min-w-0 rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Points Wagered</p>
              <p className="text-2xl font-semibold">
                {support.reduce((sum, s) => sum + s.pointsSpent, 0)}
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Points Paid Out</p>
              <p className="text-2xl font-semibold">
                {support.reduce((sum, s) => sum + s.pointsEarned, 0)}
              </p>
            </div>
          </div>

          {matchesWithSupport.length === 0 ? (
            <p className="text-sm text-muted-foreground">No support given yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {matchesWithSupport.map((m) => {
                const matchSupport = supportByMatch.get(m.id) ?? []
                const p1Support = matchSupport.filter((s) => s.predictedWinnerId === m.player1Id).length
                const p2Support = matchSupport.filter((s) => s.predictedWinnerId === m.player2Id).length
                return (
                  <div key={m.id} className="rounded-xl border border-border p-3">
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">
                      {getRoundLabel(m.round, totalRounds)} · Match {m.matchNumber}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {m.player1Id ? players[m.player1Id]?.name : "TBD"} —{" "}
                        <strong>{p1Support}</strong> support
                      </span>
                      <span>
                        {m.player2Id ? players[m.player2Id]?.name : "TBD"} —{" "}
                        <strong>{p2Support}</strong> support
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Export Results</CardTitle>
          <Button render={<a href={`/api/tournaments/${id}/export`} />} nativeButton={false}>
            <Download className="size-4" />
            Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Downloads every participant with their seed and final placement.
          </p>
        </CardContent>
      </Card>

      {admin.role === "DEVELOPER" && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Developer Zone</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Wipes every match, support record, and wallet, and un-eliminates all participants back to
              round 1. Can&apos;t be undone.
            </p>
            <ResetTournamentButton tournamentId={id} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

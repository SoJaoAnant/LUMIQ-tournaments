import { notFound } from "next/navigation"
import { Info } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getTournament } from "@/lib/data/tournaments"
import { getBracketData } from "@/lib/data/bracket"
import { hasAtLeastRole } from "@/lib/rbac"
import { BracketView } from "@/components/bracket/bracket-view"
import { GenerateBracketButton } from "@/components/admin/generate-bracket-button"
import { BracketSwapPanel } from "@/components/admin/bracket-swap-panel"
import { BulkBettingControls } from "@/components/admin/bulk-betting-controls"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function TournamentBracketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const isAdmin = hasAtLeastRole(user.role, "ADMIN")

  const [{ matches, players }, wallet, myBets, participantCount] = await Promise.all([
    getBracketData(id),
    db.tournamentWallet.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId: id } },
    }),
    db.bet.findMany({ where: { userId: user.id, match: { tournamentId: id } } }),
    isAdmin ? db.participant.count({ where: { tournamentId: id } }) : Promise.resolve(0),
  ])

  const betsByMatch = Object.fromEntries(myBets.map((b) => [b.matchId, b.predictedWinnerId]))

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && tournament.status === "REGISTRATION_CLOSED" && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">
            Registration is closed with {participantCount} participants. Ready to generate the
            bracket.
          </p>
          <GenerateBracketButton tournamentId={id} participantCount={participantCount} />
        </div>
      )}

      {isAdmin && tournament.status === "REGISTRATION_OPEN" && (
        <Alert>
          <Info className="size-4" />
          <AlertTitle>Registration is still open</AlertTitle>
          <AlertDescription>
            Close registration (in the Manage tab) before the bracket can be generated.
          </AlertDescription>
        </Alert>
      )}

      {isAdmin && matches.length > 0 && (
        <>
          <BulkBettingControls
            tournamentId={id}
            eligibleCount={
              matches.filter(
                (m) => m.status === "SCHEDULED" && !m.isBye && m.player1Id && m.player2Id
              ).length
            }
            openCount={matches.filter((m) => m.status === "BETTING_OPEN").length}
          />
          <BracketSwapPanel
            matches={matches}
            players={players}
            totalRounds={Math.max(...matches.map((m) => m.round))}
          />
        </>
      )}

      <BracketView
        matches={matches}
        players={players}
        bettable
        betsByMatch={betsByMatch}
        canBet={(wallet?.currentPoints ?? 0) >= 1}
        adminMode={isAdmin}
        isDeveloper={user.role === "DEVELOPER"}
      />
    </div>
  )
}

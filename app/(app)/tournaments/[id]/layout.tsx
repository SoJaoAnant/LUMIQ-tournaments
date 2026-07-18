import { notFound } from "next/navigation"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getMyParticipation, getTournament } from "@/lib/data/tournaments"
import { getBracketData, getTournamentStage } from "@/lib/data/bracket"
import { computeRounds } from "@/lib/bracket"
import { hasAtLeastRole } from "@/lib/rbac"
import { TournamentStatusBadge } from "@/components/tournament/status-badge"
import { TournamentTabs } from "@/components/tournament/tournament-tabs"
import { TournamentHeader } from "@/components/tournament/tournament-header"
import { JoinLeaveButton } from "@/components/tournament/join-leave-button"
import { WalletPointsBadge } from "@/components/support/wallet-points-badge"

export default async function TournamentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireUser(`/tournaments/${id}`)

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const [participation, wallet, participantCount, { matches }] = await Promise.all([
    getMyParticipation(id, user.id),
    db.tournamentWallet.findUnique({
      where: { userId_tournamentId: { userId: user.id, tournamentId: id } },
    }),
    db.participant.count({ where: { tournamentId: id, isPlayer: true } }),
    getBracketData(id),
  ])

  const totalRounds = matches.length
    ? Math.max(...matches.map((m) => m.round))
    : computeRounds(Math.max(participantCount, 2))
  const stage = getTournamentStage(matches, totalRounds)
  const supportOpen = matches.some((m) => m.status === "SUPPORT_OPEN")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <TournamentHeader id={id} title={tournament.title} participantCount={participantCount} stage={stage} />
        {!stage && <TournamentStatusBadge status={tournament.status} />}
        {tournament.description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{tournament.description}</p>
        )}
        <div className="flex items-center gap-3">
          {wallet && <WalletPointsBadge points={wallet.currentPoints} label="points, this cup" size="sm" />}
          <JoinLeaveButton tournament={tournament} isParticipant={!!participation} />
        </div>
      </div>

      <TournamentTabs
        tournamentId={id}
        supportOpen={supportOpen}
        canManage={hasAtLeastRole(user.role, "ADMIN")}
      />

      {children}
    </div>
  )
}

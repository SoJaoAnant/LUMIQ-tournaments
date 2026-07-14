import Link from "next/link"
import type { Match } from "@prisma/client"

import { getRoundLabel } from "@/lib/bracket"
import { getBetStake } from "@/lib/betting"
import { AvatarTile } from "@/components/shared/avatar-tile"
import { cn } from "@/lib/utils"

type PlayerInfo = { name: string; seed: number; eliminated: boolean }

function PlayerBlock({
  player,
  isMe,
  align,
}: {
  player: PlayerInfo | undefined
  isMe: boolean
  align: "left" | "right"
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-3",
        align === "right" && "flex-row-reverse text-right"
      )}
    >
      <AvatarTile
        name={player?.name ?? "TBD"}
        size="lg"
        ring={isMe}
        className="border-2 border-white/40"
      />
      <div className="min-w-0">
        <p className="truncate font-heading text-base font-bold sm:text-lg">
          {player?.name ?? "TBD"}
        </p>
        <p className="text-xs text-white/75">
          {player ? `Seed #${player.seed}` : "Awaiting result"}
          {isMe && " · You"}
        </p>
      </div>
    </div>
  )
}

export function HeroMatchCard({
  tournamentId,
  match,
  players,
  totalRounds,
  myParticipantId,
}: {
  tournamentId: string
  match: Match
  players: Record<string, PlayerInfo>
  totalRounds: number
  myParticipantId: string | null
}) {
  const p1 = match.player1Id ? players[match.player1Id] : undefined
  const p2 = match.player2Id ? players[match.player2Id] : undefined
  const roundLabel = getRoundLabel(match.round, totalRounds)

  const pillLabel =
    match.status === "LIVE"
      ? `${roundLabel} · LIVE`
      : match.status === "BETTING_OPEN"
        ? `${roundLabel} · BETTING OPEN`
        : match.status === "FINISHED"
          ? `${roundLabel} · CONCLUDED`
          : `${roundLabel} · UPCOMING`

  const stake = getBetStake(match.round)

  const cta =
    match.status === "BETTING_OPEN"
      ? {
          href: `/tournaments/${tournamentId}/betting`,
          label: `Place your bet — win ${stake * 2} points →`,
        }
      : match.status === "LIVE"
        ? { href: `/tournaments/${tournamentId}/bracket`, label: "Match is live — follow the bracket →" }
        : match.status === "FINISHED"
          ? { href: `/tournaments/${tournamentId}/results`, label: "See the winners reveal →" }
          : { href: `/tournaments/${tournamentId}/bracket`, label: "View the bracket →" }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#7A7DE8,#898CEC_45%,#E583BA)] p-6 text-white shadow-lg shadow-primary/25 sm:p-7">
      <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
        {(match.status === "LIVE" || match.status === "BETTING_OPEN") && (
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex size-1.5 rounded-full bg-white" />
          </span>
        )}
        {pillLabel}
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3">
        <PlayerBlock player={p1} isMe={!!match.player1Id && match.player1Id === myParticipantId} align="left" />
        <span className="shrink-0 font-heading text-sm font-bold text-white/70">VS</span>
        <PlayerBlock player={p2} isMe={!!match.player2Id && match.player2Id === myParticipantId} align="right" />
      </div>

      <Link
        href={cta.href}
        className="relative mt-5 flex w-full items-center justify-center rounded-xl bg-white py-3 text-sm font-bold text-primary shadow-sm transition-transform hover:scale-[1.01]"
      >
        {cta.label}
      </Link>
    </div>
  )
}

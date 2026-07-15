import type { Match, MatchStatus } from "@prisma/client"
import { Trophy } from "lucide-react"

import { MatchNode, type MatchBet } from "@/components/bracket/match-node"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"

type PlayerInfo = { name: string; seed: number; eliminated: boolean }

const LEGEND: { dotClassName: string; label: string }[] = [
  { dotClassName: "bg-destructive", label: "Betting" },
  { dotClassName: "bg-[#E9A23B]", label: "Live" },
  { dotClassName: "bg-primary/35", label: "Scheduled" },
  { dotClassName: "bg-muted-foreground/40", label: "Concluded" },
]

const ACTIVE_CHILD_STATUSES: MatchStatus[] = ["BETTING_OPEN", "LIVE"]

function sortByMatchNumber(matches: Match[]) {
  return [...matches].sort((a, b) => a.matchNumber - b.matchNumber)
}

/** Full-width `<svg>` band connecting one round's matches down into the next round's. */
function ConnectorBand({ parents, childMatches }: { parents: Match[]; childMatches: Match[] }) {
  const childCount = childMatches.length
  const paths: { d: string; active: boolean }[] = []

  childMatches.forEach((child, j) => {
    const childCx = ((j + 0.5) / childCount) * 1000
    const active = ACTIVE_CHILD_STATUSES.includes(child.status)
    parents
      .filter((p) => p.nextMatchId === child.id)
      .forEach((parent) => {
        const pi = parents.indexOf(parent)
        const parentCx = ((pi + 0.5) / parents.length) * 1000
        paths.push({ d: `M ${parentCx} 0 V 50 H ${childCx} V 100`, active })
      })
  })

  return (
    <svg viewBox="0 0 1000 100" preserveAspectRatio="none" className="block h-(--gap) w-full">
      {paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={p.active ? "stroke-accent" : "stroke-border"}
        />
      ))}
    </svg>
  )
}

function MatchRow({
  matches,
  renderMatch,
}: {
  matches: Match[]
  renderMatch: (m: Match) => React.ReactNode
}) {
  return (
    <div className="flex w-full">
      {matches.map((m) => (
        <div key={m.id} style={{ width: `${100 / matches.length}%` }} className="flex justify-center">
          {renderMatch(m)}
        </div>
      ))}
    </div>
  )
}

export function BracketView({
  matches,
  players,
  bettable = false,
  betsByMatch,
  canBet = false,
  adminMode = false,
  isDeveloper = false,
}: {
  matches: Match[]
  players: Record<string, PlayerInfo>
  /** Enables click-to-bet on BETTING_OPEN matches. Leave off for admin/read-only views. */
  bettable?: boolean
  betsByMatch?: Record<string, MatchBet>
  canBet?: boolean
  /** Enables inline match management (betting, start, winner, override) from the tree. */
  adminMode?: boolean
  isDeveloper?: boolean
}) {
  if (matches.length === 0) {
    return (
      <EmptyState
        icon={Trophy}
        title="Bracket not generated yet"
        description="The bracket will appear here once an admin closes registration and generates it."
      />
    )
  }

  const totalRounds = Math.max(...matches.map((m) => m.round))
  const roundNumbers = Array.from({ length: totalRounds }, (_, i) => i + 1)
  const bronze = matches.find((m) => m.isThirdPlaceMatch)

  const roundsOfMatches = roundNumbers.map((round) =>
    sortByMatchNumber(matches.filter((m) => m.round === round && !m.isThirdPlaceMatch))
  )
  const firstRoundCount = roundsOfMatches[0]?.length ?? 1

  function renderMatch(m: Match) {
    return (
      <MatchNode
        key={m.id}
        match={m}
        totalRounds={totalRounds}
        player1={m.player1Id ? players[m.player1Id] : undefined}
        player2={m.player2Id ? players[m.player2Id] : undefined}
        bettable={bettable}
        myBet={betsByMatch?.[m.id] ?? null}
        canBet={canBet}
        adminMode={adminMode}
        isDeveloper={isDeveloper}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-semibold text-muted-foreground">
        {LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", l.dotClassName)} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="no-scrollbar max-h-[74vh] overflow-auto [--box:76px] [--gap:44px] [--slot:88px] min-[860px]:[--box:100px] min-[860px]:[--gap:56px] min-[860px]:[--slot:136px]">
          <div
            className="mx-auto flex min-w-0 flex-col"
            style={{ width: `calc(var(--slot) * ${firstRoundCount})` }}
          >
            {roundsOfMatches.map((roundMatches, idx) => {
              const isLast = idx === roundsOfMatches.length - 1
              return (
                <div key={roundMatches[0]?.round ?? idx}>
                  <MatchRow matches={roundMatches} renderMatch={renderMatch} />
                  {!isLast && (
                    <ConnectorBand parents={roundMatches} childMatches={roundsOfMatches[idx + 1]} />
                  )}
                </div>
              )
            })}

            {bronze && (
              <div className="mt-4 border-t border-dashed border-border pt-4">
                <MatchRow matches={[bronze]} renderMatch={renderMatch} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

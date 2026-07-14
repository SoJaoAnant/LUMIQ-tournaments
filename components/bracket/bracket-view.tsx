import type { Match } from "@prisma/client"
import { ArrowDown, Trophy } from "lucide-react"

import { getRoundLabel } from "@/lib/bracket"
import { MatchNode } from "@/components/bracket/match-node"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"

type PlayerInfo = { name: string; seed: number; eliminated: boolean }

type RoundStatus = "done" | "live" | "betting" | "upcoming"

const ROUND_STATUS: Record<RoundStatus, { label: string; cls: string }> = {
  done: { label: "Done", cls: "bg-muted text-muted-foreground" },
  live: { label: "Live", cls: "bg-destructive/10 text-destructive" },
  betting: { label: "Betting open", cls: "bg-destructive/10 text-destructive" },
  upcoming: { label: "Upcoming", cls: "bg-primary/8 text-primary" },
}

function roundStatusOf(matches: Match[]): RoundStatus {
  if (matches.some((m) => m.status === "LIVE")) return "live"
  if (matches.some((m) => m.status === "BETTING_OPEN")) return "betting"
  if (matches.every((m) => m.status === "FINISHED")) return "done"
  return "upcoming"
}

function RoundHeader({ label, matches }: { label: string; matches: Match[] }) {
  const status = ROUND_STATUS[roundStatusOf(matches)]
  return (
    <div className="flex items-center gap-2">
      <p className="font-heading text-sm font-bold">{label}</p>
      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", status.cls)}>
        {status.label}
      </span>
    </div>
  )
}

function RoundConnector() {
  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <div className="h-4 w-px bg-border" />
      <div className="grid size-[30px] shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <ArrowDown className="size-4" />
      </div>
      <div className="h-4 w-px bg-border" />
      <p className="text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
        Winners advance
      </p>
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
  betsByMatch?: Record<string, string>
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

  function renderMatch(m: Match) {
    return (
      <MatchNode
        key={m.id}
        match={m}
        player1={m.player1Id ? players[m.player1Id] : undefined}
        player2={m.player2Id ? players[m.player2Id] : undefined}
        bettable={bettable}
        myBetPredictedWinnerId={betsByMatch?.[m.id] ?? null}
        canBet={canBet}
        adminMode={adminMode}
        isDeveloper={isDeveloper}
      />
    )
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="no-scrollbar max-h-[74vh] overflow-auto">
        <div className="mx-auto flex w-max min-w-full flex-col items-center gap-3">
          {roundNumbers.map((round, idx) => {
            const roundMatches = matches
              .filter((m) => m.round === round && !m.isThirdPlaceMatch)
              .sort((a, b) => a.matchNumber - b.matchNumber)

            return (
              <div key={round} className="flex flex-col items-center gap-2.5">
                <RoundHeader label={getRoundLabel(round, totalRounds)} matches={roundMatches} />
                <div className="flex flex-nowrap justify-center gap-3">
                  {roundMatches.map(renderMatch)}
                </div>
                {idx < roundNumbers.length - 1 && <RoundConnector />}
              </div>
            )
          })}

          {bronze && (
            <div className="mt-1 flex flex-col items-center gap-2.5 border-t border-dashed border-border pt-4">
              <RoundHeader label="3rd Place Match" matches={[bronze]} />
              {renderMatch(bronze)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

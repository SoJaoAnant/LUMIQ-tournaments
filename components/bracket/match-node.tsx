"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check } from "lucide-react"
import type { Match, MatchStatus } from "@prisma/client"

import { placeBet } from "@/lib/actions/bets"
import { getBetStake } from "@/lib/betting"
import { getRoundLabel } from "@/lib/bracket"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AvatarTile } from "@/components/shared/avatar-tile"
import { MatchAdminControls } from "@/components/admin/match-admin-controls"
import { cn } from "@/lib/utils"

type Player = { name: string; seed: number; eliminated: boolean } | undefined

export type MatchBet = {
  predictedWinnerId: string
  won: boolean | null
  pointsEarned: number
  pointsSpent: number
}

const STATE_CONFIG: Record<
  MatchStatus,
  {
    label: string
    dot: string
    border: string
    bg: string
    pillBg: string
    pillText: string
    dashed?: boolean
  }
> = {
  SCHEDULED: {
    label: "Soon",
    dot: "bg-primary/35",
    border: "border-primary/25",
    bg: "bg-primary/5",
    pillBg: "bg-primary/10",
    pillText: "text-primary",
    dashed: true,
  },
  BETTING_OPEN: {
    label: "Betting",
    dot: "bg-destructive",
    border: "border-destructive/40",
    bg: "bg-destructive/6",
    pillBg: "bg-destructive/10",
    pillText: "text-destructive",
  },
  LIVE: {
    label: "Live",
    dot: "bg-[#E9A23B]",
    border: "border-[#E9A23B]/50",
    bg: "bg-[#E9A23B]/8",
    pillBg: "bg-[#E9A23B]/12",
    pillText: "text-[#B67A17]",
  },
  FINISHED: {
    label: "Done",
    dot: "bg-muted-foreground/40",
    border: "border-border",
    bg: "bg-muted-foreground/5",
    pillBg: "bg-muted",
    pillText: "text-muted-foreground",
  },
}

function firstName(name: string) {
  return name.split(" ")[0]
}

function StateDot({ config }: { config: (typeof STATE_CONFIG)[MatchStatus] }) {
  return <span className={cn("inline-flex size-1.5 shrink-0 rounded-full", config.dot)} />
}

function PlayerRow({
  player,
  isWinner,
  isLoser,
  isBye,
}: {
  player: Player
  isWinner: boolean
  isLoser: boolean
  isBye?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm",
        isWinner && "bg-primary/10 font-semibold text-primary",
        isLoser && "opacity-60"
      )}
    >
      <AvatarTile name={player ? player.name : "—"} size="sm" className="text-xs" />
      <span className="min-w-0 flex-1 truncate">
        {player ? player.name : isBye ? "— Bye —" : "To be decided"}
      </span>
      {isWinner && <Check className="size-4 shrink-0 text-primary" />}
    </div>
  )
}

export function MatchNode({
  match,
  totalRounds,
  player1,
  player2,
  bettable = false,
  myBet = null,
  canBet = false,
  adminMode = false,
  isDeveloper = false,
}: {
  match: Match
  totalRounds: number
  player1: Player
  player2: Player
  /** Whether this bracket view allows placing bets at all (off for admin views). */
  bettable?: boolean
  myBet?: MatchBet | null
  canBet?: boolean
  /** Whether this bracket view lets an admin manage the match inline (off for player views). */
  adminMode?: boolean
  isDeveloper?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const {
    id: matchId,
    round,
    status,
    isBye,
    isThirdPlaceMatch,
    winnerId,
    player1Id,
    player2Id,
  } = match

  const config = STATE_CONFIG[status]
  const bothKnown = !!player1Id && !!player2Id
  const concluded = status === "FINISHED" && !!winnerId
  const isWinner1 = concluded && winnerId === player1Id
  const isWinner2 = concluded && winnerId === player2Id

  const canOpenBetDialog = bettable && status === "BETTING_OPEN" && bothKnown && !myBet
  const showResultChip = bettable && !isBye && !canOpenBetDialog
  const stake = getBetStake(round)

  function handleBet(predictedWinnerId: string) {
    startTransition(async () => {
      try {
        await placeBet(matchId, predictedWinnerId)
        toast.success("Bet placed — good luck!")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't place bet")
      }
    })
  }

  const p1Label = player1 ? firstName(player1.name) : isBye ? "Bye" : "TBD"
  const p2Label = player2 ? firstName(player2.name) : isBye ? "Bye" : "TBD"
  const roundName = isThirdPlaceMatch ? "3rd place match" : getRoundLabel(round, totalRounds)

  let resultChip: { label: string; className: string; note: string } | null = null
  if (showResultChip) {
    if (myBet?.won === true) {
      resultChip = {
        label: `Won +${myBet.pointsEarned}`,
        className: "bg-[#3FBF87]/12 text-[#2C9E6E]",
        note: "Your bet on this match settled.",
      }
    } else if (myBet?.won === false) {
      resultChip = {
        label: `Missed −${myBet.pointsSpent}`,
        className: "bg-destructive/10 text-destructive",
        note: "Your bet on this match settled.",
      }
    } else if (myBet) {
      resultChip = {
        label: "Pending",
        className: "bg-primary/10 text-primary",
        note: "Your bet is locked in — check back once this match concludes.",
      }
    } else {
      resultChip = {
        label: "No bet",
        className: "bg-muted text-muted-foreground",
        note:
          status === "SCHEDULED"
            ? "Betting hasn't opened for this match yet."
            : "You didn't bet on this match.",
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${p1Label} vs ${p2Label}`}
        className={cn(
          "flex size-(--box) shrink-0 flex-col items-center justify-center gap-0.5 rounded-[15px] border-[1.5px] p-1.5 text-center",
          config.dashed && "border-dashed",
          config.border,
          config.bg
        )}
      >
        <span className="mb-0.5 flex items-center gap-1 text-[8px] font-bold tracking-wide text-muted-foreground uppercase">
          <StateDot config={config} />
          {config.label}
        </span>
        <span
          className={cn(
            "line-clamp-1 max-w-full text-[11px] leading-tight font-bold text-foreground",
            concluded && !isWinner1 && "text-muted-foreground/60 font-semibold"
          )}
        >
          {p1Label}
        </span>
        <span className="text-[8px] font-bold text-muted-foreground/50 uppercase">vs</span>
        <span
          className={cn(
            "line-clamp-1 max-w-full text-[11px] leading-tight font-bold text-foreground",
            concluded && !isWinner2 && "text-muted-foreground/60 font-semibold"
          )}
        >
          {p2Label}
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="top-auto right-0 bottom-0 left-0 max-h-[85vh] w-full max-w-full translate-x-0 translate-y-0 gap-4 overflow-y-auto rounded-t-3xl rounded-b-none border-t pb-[calc(1rem+env(safe-area-inset-bottom))] sm:top-1/2 sm:right-auto sm:bottom-auto sm:left-1/2 sm:w-full sm:max-w-[440px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:pb-4">
          <div className="mx-auto -mt-1 mb-1 h-1 w-9 rounded-full bg-muted-foreground/25 sm:hidden" />
          <DialogHeader className="flex-row items-center gap-2 space-y-0 pr-8">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{roundName}</p>
              <DialogTitle>Match details</DialogTitle>
            </div>
            <span
              className={cn(
                "ml-auto flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
                config.pillBg,
                config.pillText
              )}
            >
              <StateDot config={config} />
              {config.label}
            </span>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <PlayerRow player={player1} isWinner={isWinner1} isLoser={concluded && !isWinner1} isBye={isBye} />
            <PlayerRow player={player2} isWinner={isWinner2} isLoser={concluded && !isWinner2} isBye={isBye} />
          </div>

          {canOpenBetDialog && (
            <div className="flex flex-col gap-2 rounded-2xl border border-primary/20 bg-primary/5 p-3.5">
              <p className="text-xs text-muted-foreground">
                Back a winner — stake {stake} point{stake === 1 ? "" : "s"}, win {stake * 2} back.
              </p>
              {[player1Id, player2Id].map((pid, i) => {
                const p = i === 0 ? player1 : player2
                if (!pid || !p) return null
                return (
                  <Button
                    key={pid}
                    variant="outline"
                    className="justify-start"
                    disabled={isPending || !canBet}
                    loading={isPending}
                    onClick={() => handleBet(pid)}
                  >
                    {p.name} <span className="text-xs text-muted-foreground">#{p.seed}</span>
                  </Button>
                )
              })}
              {!canBet && (
                <p className="text-xs text-destructive">You don&apos;t have enough betting points left.</p>
              )}
            </div>
          )}

          {resultChip && (
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3.5">
              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-bold", resultChip.className)}>
                {resultChip.label}
              </span>
              <span className="text-xs font-medium text-muted-foreground">{resultChip.note}</span>
            </div>
          )}

          {adminMode && (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-bold tracking-wide text-muted-foreground uppercase">
                Organizer controls
              </p>
              <MatchAdminControls
                match={match}
                players={{
                  ...(player1Id && player1 ? { [player1Id]: player1 } : {}),
                  ...(player2Id && player2 ? { [player2Id]: player2 } : {}),
                }}
                isDeveloper={isDeveloper}
                onDeclared={() => setOpen(false)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

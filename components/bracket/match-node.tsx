"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Ticket } from "lucide-react"
import type { Match, MatchStatus } from "@prisma/client"

import { placeBet } from "@/lib/actions/bets"
import { getBetStake } from "@/lib/betting"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AvatarTile } from "@/components/shared/avatar-tile"
import { MatchAdminControls } from "@/components/admin/match-admin-controls"
import { cn } from "@/lib/utils"

type Player = { name: string; seed: number; eliminated: boolean } | undefined

const STATUS_LABEL: Record<MatchStatus, string> = {
  SCHEDULED: "Upcoming",
  BETTING_OPEN: "Betting window open",
  LIVE: "Live",
  FINISHED: "Concluded",
}

const DOT_CLASS: Record<MatchStatus, string> = {
  SCHEDULED: "bg-primary/40",
  BETTING_OPEN: "bg-destructive",
  LIVE: "bg-destructive",
  FINISHED: "bg-muted-foreground/40",
}

function StatusDot({ status, isBye }: { status: MatchStatus; isBye: boolean }) {
  if (isBye) return <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/30" />
  const pulse = status === "BETTING_OPEN" || status === "LIVE"
  return (
    <span className="relative flex size-1.5 shrink-0">
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-70",
            DOT_CLASS[status]
          )}
        />
      )}
      <span className={cn("relative inline-flex size-1.5 rounded-full", DOT_CLASS[status])} />
    </span>
  )
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
        "flex items-center gap-2 px-2.5 py-2 text-sm",
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
  player1,
  player2,
  bettable = false,
  myBetPredictedWinnerId = null,
  canBet = false,
  adminMode = false,
  isDeveloper = false,
}: {
  match: Match
  player1: Player
  player2: Player
  /** Whether this bracket view allows placing bets at all (off for admin views). */
  bettable?: boolean
  myBetPredictedWinnerId?: string | null
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
    matchNumber,
    round,
    status,
    isBye,
    isThirdPlaceMatch,
    winnerId,
    player1Id,
    player2Id,
  } = match

  const canOpenBetDialog =
    bettable && status === "BETTING_OPEN" && !!player1Id && !!player2Id && !myBetPredictedWinnerId
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

  const p1Label = player1 ? player1.name : isBye ? "Bye" : "TBD"
  const p2Label = player2 ? player2.name : isBye ? "Bye" : "TBD"

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`${p1Label} vs ${p2Label}`}
        className={cn(
          "group flex w-full min-w-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2 text-left shadow-sm transition-colors hover:border-primary/50",
          !player1Id && !player2Id && !isBye && "bg-primary/5"
        )}
      >
        <StatusDot status={status} isBye={isBye} />
        <span className="min-w-0 flex-1 truncate text-[11px] leading-tight font-medium">
          <span className={cn(winnerId === player1Id && "font-bold text-primary", winnerId === player2Id && !!player1Id && "opacity-50")}>
            {p1Label}
          </span>
          <span className="text-muted-foreground"> vs </span>
          <span className={cn(winnerId === player2Id && "font-bold text-primary", winnerId === player1Id && !!player2Id && "opacity-50")}>
            {p2Label}
          </span>
        </span>
        {bettable && myBetPredictedWinnerId && (
          <Ticket className="size-3 shrink-0 text-primary" />
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isThirdPlaceMatch ? "3rd Place Match" : `Match ${matchNumber}`}
            </DialogTitle>
            <DialogDescription>
              {isBye ? "Bye — automatic advance." : STATUS_LABEL[status]}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
            <PlayerRow
              player={player1}
              isWinner={!!winnerId && winnerId === player1Id}
              isLoser={!!winnerId && winnerId !== player1Id && !!player1Id}
              isBye={isBye}
            />
            <PlayerRow
              player={player2}
              isWinner={!!winnerId && winnerId === player2Id}
              isLoser={!!winnerId && winnerId !== player2Id && !!player2Id}
              isBye={isBye}
            />
          </div>

          {bettable && myBetPredictedWinnerId && (
            <Badge variant="secondary" className="w-full justify-center gap-1 text-xs">
              <Ticket className="size-3" />
              You bet on {myBetPredictedWinnerId === player1Id ? player1?.name : player2?.name}
            </Badge>
          )}

          {canOpenBetDialog && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                This round costs {stake} point{stake === 1 ? "" : "s"} to bet. Correct picks
                return {stake * 2} points; wrong picks lose the {stake} staked (even below zero).
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
                <p className="text-xs text-destructive">
                  You don&apos;t have enough betting points left.
                </p>
              )}
            </div>
          )}

          {adminMode && (
            <MatchAdminControls
              match={match}
              players={{
                ...(player1Id && player1 ? { [player1Id]: player1 } : {}),
                ...(player2Id && player2 ? { [player2Id]: player2 } : {}),
              }}
              isDeveloper={isDeveloper}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

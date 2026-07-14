"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Ticket } from "lucide-react"
import type { MatchStatus } from "@prisma/client"

import { placeBet } from "@/lib/actions/bets"
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
import { cn } from "@/lib/utils"

type Player = { name: string; seed: number; eliminated: boolean } | undefined

const STATUS_PILL: Record<MatchStatus, { label: string; cls: string; pulse?: boolean } | null> = {
  BETTING_OPEN: { label: "Betting window open", cls: "bg-destructive/10 text-destructive", pulse: true },
  LIVE: { label: "Live", cls: "bg-destructive/10 text-destructive", pulse: true },
  FINISHED: { label: "Concluded", cls: "bg-muted text-muted-foreground" },
  SCHEDULED: { label: "Upcoming", cls: "bg-primary/8 text-primary" },
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
        {player ? player.name : isBye ? "— Bye —" : "TBD"}
      </span>
      {isWinner && <Check className="size-4 shrink-0 text-primary" />}
    </div>
  )
}

export function MatchNode({
  matchId,
  matchNumber,
  status,
  isBye,
  isThirdPlaceMatch,
  player1,
  player2,
  winnerId,
  player1Id,
  player2Id,
  bettable = false,
  myBetPredictedWinnerId = null,
  canBet = false,
}: {
  matchId: string
  matchNumber: number
  status: MatchStatus
  isBye: boolean
  isThirdPlaceMatch: boolean
  player1: Player
  player2: Player
  winnerId: string | null
  player1Id: string | null
  player2Id: string | null
  /** Whether this bracket view allows placing bets at all (off for admin views). */
  bettable?: boolean
  myBetPredictedWinnerId?: string | null
  canBet?: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const canOpenBetDialog =
    bettable && status === "BETTING_OPEN" && !!player1Id && !!player2Id && !myBetPredictedWinnerId
  const pill = !isBye ? STATUS_PILL[status] : null
  const isFutureMatch = !isBye && !player1Id && !player2Id

  function handleBet(predictedWinnerId: string) {
    startTransition(async () => {
      try {
        await placeBet(matchId, predictedWinnerId)
        toast.success("Bet placed — good luck!")
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't place bet")
      }
    })
  }

  return (
    <div className="flex w-[212px] shrink-0 flex-col items-center gap-1.5">
      {pill && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap",
            pill.cls
          )}
        >
          {pill.pulse && (
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive/70" />
              <span className="relative inline-flex size-1.5 rounded-full bg-destructive" />
            </span>
          )}
          {isThirdPlaceMatch ? `Bronze · ${pill.label}` : pill.label}
        </span>
      )}

      <div
        className={cn(
          "w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm",
          isFutureMatch && "bg-primary/5"
        )}
      >
        <div className="flex flex-col divide-y divide-border">
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
          <div className="border-t border-border px-2.5 py-1.5">
            <Badge variant="secondary" className="w-full justify-center gap-1 text-[10px]">
              <Ticket className="size-3" />
              You bet on {myBetPredictedWinnerId === player1Id ? player1?.name : player2?.name}
            </Badge>
          </div>
        )}

        {canOpenBetDialog && (
          <div className="p-2 pt-0">
            <Button
              size="sm"
              className="w-full"
              disabled={!canBet}
              onClick={() => setOpen(true)}
            >
              {canBet ? "Place bet →" : "Not enough points"}
            </Button>
          </div>
        )}
      </div>

      {canOpenBetDialog && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Place your bet — Match {matchNumber}</DialogTitle>
              <DialogDescription>
                Costs 1 point. Correct picks return 2 points; wrong picks return none. Bets can&apos;t
                be changed once placed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {[player1Id, player2Id].map((pid, i) => {
                const p = i === 0 ? player1 : player2
                if (!pid || !p) return null
                return (
                  <Button
                    key={pid}
                    variant="outline"
                    className="justify-start"
                    disabled={isPending || !canBet}
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

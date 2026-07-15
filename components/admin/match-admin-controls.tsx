"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Match } from "@prisma/client"
import { Play, ShieldAlert, Ticket, Trophy } from "lucide-react"

import { closeBetting, declareWinner, openBetting, startMatch } from "@/lib/actions/matches"
import { overrideMatch } from "@/lib/actions/developer"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type PlayerInfo = { name: string; seed: number; eliminated: boolean }

export function MatchAdminControls({
  match,
  players,
  isDeveloper = false,
  onDeclared,
}: {
  match: Match
  players: Record<string, PlayerInfo>
  isDeveloper?: boolean
  /** Called immediately once a winner is picked, e.g. to close the enclosing match panel. */
  onDeclared?: () => void
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [winnerOpen, setWinnerOpen] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)

  function run(action: () => Promise<unknown>, message: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(message)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  const bothKnown = !!match.player1Id && !!match.player2Id

  if (match.isBye) {
    return <span className="text-xs text-muted-foreground">No actions</span>
  }

  if (match.status === "FINISHED") {
    if (!isDeveloper) return <span className="text-xs text-muted-foreground">No actions</span>

    return (
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <ShieldAlert className="size-3.5" />
          Override
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Match Result</DialogTitle>
            <DialogDescription>
              Only works if what this match feeds into hasn&apos;t progressed yet. Otherwise,
              reset the tournament instead.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {[match.player1Id, match.player2Id].map((pid) =>
              pid ? (
                <Button
                  key={pid}
                  variant={pid === match.winnerId ? "default" : "outline"}
                  className="justify-start"
                  disabled={isPending || pid === match.winnerId}
                  loading={isPending}
                  onClick={() => {
                    run(() => overrideMatch(match.id, pid), "Result overridden")
                    setOverrideOpen(false)
                  }}
                >
                  {players[pid]?.name ?? pid} {pid === match.winnerId && "(current winner)"}
                </Button>
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {match.status === "SCHEDULED" && bothKnown && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          loading={isPending}
          onClick={() => run(() => openBetting(match.id), "Betting opened")}
        >
          <Ticket className="size-3.5" />
          Open Betting
        </Button>
      )}

      {match.status === "BETTING_OPEN" && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          loading={isPending}
          onClick={() => run(() => closeBetting(match.id), "Betting closed")}
        >
          Close Betting
        </Button>
      )}

      {(match.status === "SCHEDULED" || match.status === "BETTING_OPEN") && bothKnown && (
        <Button
          size="sm"
          disabled={isPending}
          loading={isPending}
          onClick={() => run(() => startMatch(match.id), "Match is live")}
        >
          <Play className="size-3.5" />
          Start Match
        </Button>
      )}

      {match.status === "LIVE" && (
        <Dialog open={winnerOpen} onOpenChange={setWinnerOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Trophy className="size-3.5" />
            Declare Winner
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Declare Winner</DialogTitle>
              <DialogDescription>This ends the match and can&apos;t be undone.</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              {[match.player1Id, match.player2Id].map((pid) =>
                pid ? (
                  <Button
                    key={pid}
                    variant="outline"
                    className="justify-start"
                    disabled={isPending}
                    loading={isPending}
                    onClick={() => {
                      run(() => declareWinner(match.id, pid), "Winner declared")
                      setWinnerOpen(false)
                      onDeclared?.()
                    }}
                  >
                    {players[pid]?.name ?? pid}
                  </Button>
                ) : null
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

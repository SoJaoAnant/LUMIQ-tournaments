"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { placeSupport } from "@/lib/actions/support"
import { getSupportStake } from "@/lib/support"
import { getRoundLabel } from "@/lib/bracket"
import { AvatarTile } from "@/components/shared/avatar-tile"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type PlayerInfo = { name: string; seed: number; eliminated: boolean }

const CONFETTI_COLORS = ["#F0934D", "#898CEC", "#E583BA", "#E9B949"]

function ConfettiBurst() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2
        const dist = 55 + Math.random() * 45
        const tx = Math.cos(angle) * dist
        const ty = Math.sin(angle) * dist - 16
        const style = {
          backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animation: "confpop 0.9s ease-out forwards",
          "--tx": `${tx}px`,
          "--ty": `${ty}px`,
          "--rot": `${Math.round(Math.random() * 360)}deg`,
        } as React.CSSProperties

        return (
          <span
            key={i}
            className="absolute top-1/2 left-1/2 size-1.5 rounded-sm"
            style={style}
          />
        )
      })}
    </div>
  )
}

function PlayerTile({
  player,
  selected,
  locked,
  onClick,
}: {
  player: PlayerInfo | undefined
  selected: boolean
  locked: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all",
        selected
          ? "-translate-y-0.5 border-primary bg-primary/8 shadow-md shadow-primary/15"
          : "border-border hover:border-primary/40",
        locked && !selected && "opacity-50"
      )}
    >
      {selected && (
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold whitespace-nowrap text-primary-foreground">
          ✓ Your pick
        </span>
      )}
      <AvatarTile name={player?.name ?? "TBD"} size="lg" />
      <div className="text-center">
        <p className="max-w-28 truncate text-sm font-semibold">{player?.name ?? "TBD"}</p>
        <p className="text-xs text-muted-foreground">Seed #{player?.seed ?? "—"}</p>
      </div>
    </button>
  )
}

export function SupportBuilder({
  matchId,
  round,
  totalRounds,
  player1Id,
  player2Id,
  players,
  existingPredictedWinnerId,
  canSupport,
}: {
  matchId: string
  round: number
  totalRounds: number
  player1Id: string
  player2Id: string
  players: Record<string, PlayerInfo>
  existingPredictedWinnerId: string | null
  canSupport: boolean
}) {
  const router = useRouter()
  const [pick, setPick] = useState<string | null>(existingPredictedWinnerId)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [burst, setBurst] = useState(false)
  const [isPending, startTransition] = useTransition()

  const locked = !!existingPredictedWinnerId
  const p1 = players[player1Id]
  const p2 = players[player2Id]
  const pickedName = pick === player1Id ? p1?.name : p2?.name
  const stake = getSupportStake(round)

  function handleLock() {
    if (!pick) return
    startTransition(async () => {
      try {
        await placeSupport(matchId, pick)
        setConfirmOpen(false)
        toast.success(`Locked in on ${pickedName} — win ${stake * 2} points if they take it!`)
        setBurst(true)
        setTimeout(() => setBurst(false), 950)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't give support")
        setConfirmOpen(false)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] font-bold text-destructive">
        <span className="inline-flex size-1.5 rounded-full bg-destructive" />
        OPEN NOW · {getRoundLabel(round, totalRounds).toUpperCase()}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">Locks the moment this match goes live.</p>

      <div className="grid grid-cols-2 gap-3">
        <PlayerTile
          player={p1}
          selected={pick === player1Id}
          locked={locked}
          onClick={() => setPick(player1Id)}
        />
        <PlayerTile
          player={p2}
          selected={pick === player2Id}
          locked={locked}
          onClick={() => setPick(player2Id)}
        />
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Stake <strong className="text-foreground">{stake} pt{stake === 1 ? "" : "s"}</strong> · win{" "}
        <strong className="text-[#2C9E6E]">+{stake * 2}</strong> · miss{" "}
        <strong className="text-destructive">−{stake}</strong>
      </p>

      <div className="relative mt-3">
        <Button
          className={cn(
            "w-full",
            locked && "bg-[#3FBF87] text-white shadow-none hover:bg-[#3FBF87]"
          )}
          disabled={!pick || locked || isPending || !canSupport}
          onClick={() => setConfirmOpen(true)}
        >
          {locked ? `✓ Locked in on ${pickedName}` : pick ? "Lock in your support" : "Pick a player first"}
        </Button>
        {burst && <ConfettiBurst />}
      </div>

      {!canSupport && !locked && (
        <p className="mt-2 text-center text-xs text-destructive">
          You don&apos;t have enough support points left.
        </p>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock in your support?</DialogTitle>
            <DialogDescription>
              You&apos;re backing <strong className="text-foreground">{pickedName}</strong>. Costs{" "}
              {stake} point{stake === 1 ? "" : "s"}, wins {stake * 2} back if they take the match —
              and if you can&apos;t cover the stake, your wallet goes negative. This can&apos;t be
              changed once locked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleLock} disabled={isPending} loading={isPending}>
              Lock it in
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

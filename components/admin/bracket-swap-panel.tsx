"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Match } from "@prisma/client"
import { Repeat } from "lucide-react"

import { swapBracketPlayers } from "@/lib/actions/matches"
import { getRoundLabel } from "@/lib/bracket"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type PlayerInfo = { name: string; seed: number; eliminated: boolean }

type Slot = {
  matchId: string
  slot: 1 | 2
  matchNumber: number
  round: number
  playerName: string
}

function slotKey(s: Pick<Slot, "matchId" | "slot">) {
  return `${s.matchId}:${s.slot}`
}

export function BracketSwapPanel({
  matches,
  players,
  totalRounds,
}: {
  matches: Match[]
  players: Record<string, PlayerInfo>
  totalRounds: number
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [aValue, setAValue] = useState("")
  const [bValue, setBValue] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [force, setForce] = useState(false)

  const slots = useMemo<Slot[]>(() => {
    const list: Slot[] = []
    for (const m of matches) {
      if (m.isBye || m.isThirdPlaceMatch || m.status !== "SCHEDULED") continue
      if (m.player1Id) {
        list.push({
          matchId: m.id,
          slot: 1,
          matchNumber: m.matchNumber,
          round: m.round,
          playerName: players[m.player1Id]?.name ?? m.player1Id,
        })
      }
      if (m.player2Id) {
        list.push({
          matchId: m.id,
          slot: 2,
          matchNumber: m.matchNumber,
          round: m.round,
          playerName: players[m.player2Id]?.name ?? m.player2Id,
        })
      }
    }
    return list.sort((a, b) => a.round - b.round || a.matchNumber - b.matchNumber || a.slot - b.slot)
  }, [matches, players])

  if (slots.length < 2) return null

  const slotA = slots.find((s) => slotKey(s) === aValue)
  const slotB = slots.find((s) => slotKey(s) === bValue)
  const canSwap = !!slotA && !!slotB && slotKey(slotA) !== slotKey(slotB)

  function handleConfirm() {
    if (!slotA || !slotB) return
    startTransition(async () => {
      try {
        await swapBracketPlayers(slotA.matchId, slotA.slot, slotB.matchId, slotB.slot, force)
        toast.success(`Swapped ${slotA.playerName} and ${slotB.playerName}`)
        setConfirmOpen(false)
        setForce(false)
        setAValue("")
        setBValue("")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't swap players")
        setConfirmOpen(false)
      }
    })
  }

  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Repeat className="size-4 text-primary" />
        <h3 className="font-heading text-sm font-bold">Swap matchups</h3>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={aValue} onValueChange={(value) => setAValue(value ?? "")}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue>
              {(value: string | null) => {
                const s = slots.find((s) => slotKey(s) === value)
                return s
                  ? `${getRoundLabel(s.round, totalRounds)} · M${s.matchNumber} — ${s.playerName}`
                  : "Player A"
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {slots.map((s) => (
              <SelectItem key={slotKey(s)} value={slotKey(s)}>
                {getRoundLabel(s.round, totalRounds)} · M{s.matchNumber} — {s.playerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">⇄</span>
        <Select value={bValue} onValueChange={(value) => setBValue(value ?? "")}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue>
              {(value: string | null) => {
                const s = slots.find((s) => slotKey(s) === value)
                return s
                  ? `${getRoundLabel(s.round, totalRounds)} · M${s.matchNumber} — ${s.playerName}`
                  : "Player B"
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {slots.map((s) => (
              <SelectItem key={slotKey(s)} value={slotKey(s)}>
                {getRoundLabel(s.round, totalRounds)} · M{s.matchNumber} — {s.playerName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button disabled={!canSwap || isPending} loading={isPending} onClick={() => setConfirmOpen(true)}>
          Swap
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open)
          if (!open) setForce(false)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Swap these players?</DialogTitle>
            <DialogDescription>
              {slotA && slotB && (
                <>
                  <strong className="text-foreground">{slotA.playerName}</strong> (Match{" "}
                  {slotA.matchNumber}) and <strong className="text-foreground">{slotB.playerName}</strong>{" "}
                  (Match {slotB.matchNumber}) will swap places in the bracket. This can&apos;t be
                  undone.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <label className="flex items-start gap-2 rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
            <Checkbox
              checked={force}
              onCheckedChange={(checked) => setForce(checked === true)}
              disabled={isPending}
              className="mt-0.5"
            />
            <span>
              <span className="font-semibold text-foreground">Force swap.</span> If either match already
              has support given on it, refund those points and remove that support so the swap can go
              through. Leave unchecked to block the swap instead if support exists.
            </span>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isPending} loading={isPending}>
              Swap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

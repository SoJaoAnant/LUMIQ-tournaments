"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Tournament } from "@prisma/client"
import { Sparkles, Swords } from "lucide-react"

import { joinTournament, leaveTournament } from "@/lib/actions/tournaments"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const PITCH_MAX = 140

export function JoinLeaveButton({
  tournament,
  isParticipant,
}: {
  tournament: Pick<Tournament, "id" | "status" | "registrationClose">
  isParticipant: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"choose" | "pitch">("choose")
  const [pitch, setPitch] = useState("")
  const [isPending, startTransition] = useTransition()

  const canAct =
    tournament.status === "REGISTRATION_OPEN" && new Date() <= tournament.registrationClose

  if (!canAct) return null

  function resetDialog(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) {
      setStep("choose")
      setPitch("")
    }
  }

  function handleJoin(isPlayer: boolean, pitchValue?: string) {
    startTransition(async () => {
      try {
        await joinTournament(tournament.id, isPlayer, pitchValue)
        toast.success(
          isPlayer ? "You're in! Good luck." : "You're in as a supporter — good luck backing the field."
        )
        resetDialog(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't join tournament")
      }
    })
  }

  function handlePitchSubmit() {
    const trimmed = pitch.trim()
    if (!trimmed) {
      toast.error("Add a short pitch so people know why to back you")
      return
    }
    handleJoin(true, trimmed)
  }

  function handleLeave() {
    startTransition(async () => {
      try {
        await leaveTournament(tournament.id)
        toast.success("You've left the tournament")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't leave tournament")
      }
    })
  }

  if (isParticipant) {
    return (
      <Button variant="destructive" disabled={isPending} loading={isPending} onClick={handleLeave}>
        Leave Tournament
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={resetDialog}>
      <DialogTrigger render={<Button disabled={isPending} loading={isPending} />}>
        Join Tournament
      </DialogTrigger>
      <DialogContent>
        {step === "choose" ? (
          <>
            <DialogHeader>
              <DialogTitle>How do you want to join?</DialogTitle>
              <DialogDescription>
                Everyone who joins gets support points to back players in matches.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-1 p-4 text-left whitespace-normal"
                disabled={isPending}
                loading={isPending}
                onClick={() => setStep("pitch")}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Swords className="size-4 text-primary" />
                  Join as Player
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  Added into the bracket to compete, and you can also support other players.
                </span>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col items-start gap-1 p-4 text-left whitespace-normal"
                disabled={isPending}
                loading={isPending}
                onClick={() => handleJoin(false)}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Sparkles className="size-4 text-primary" />
                  Join as Supporter
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  Not competing — just get support points to back other players.
                </span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pitch yourself</DialogTitle>
              <DialogDescription>
                Shown under your name in the bracket — give people a reason to back you.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Textarea
                autoFocus
                placeholder="e.g. Reigning champ two years running — back me and double up."
                value={pitch}
                maxLength={PITCH_MAX}
                disabled={isPending}
                onChange={(e) => setPitch(e.target.value)}
              />
              <p className="text-right text-xs text-muted-foreground">
                {pitch.length}/{PITCH_MAX}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" disabled={isPending} onClick={() => setStep("choose")}>
                Back
              </Button>
              <Button disabled={isPending} loading={isPending} onClick={handlePitchSubmit}>
                Join as Player
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

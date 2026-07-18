"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Tournament } from "@prisma/client"
import { Layers, Sparkles, Swords } from "lucide-react"

import { joinTournament, leaveTournament } from "@/lib/actions/tournaments"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function JoinLeaveButton({
  tournament,
  isParticipant,
}: {
  tournament: Pick<Tournament, "id" | "status" | "registrationClose">
  isParticipant: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const canAct =
    tournament.status === "REGISTRATION_OPEN" && new Date() <= tournament.registrationClose

  if (!canAct) return null

  function handleJoin(isPlayer: boolean) {
    startTransition(async () => {
      try {
        await joinTournament(tournament.id, isPlayer)
        toast.success(
          isPlayer ? "You're in! Good luck." : "You're in as a supporter — good luck backing the field."
        )
        setOpen(false)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't join tournament")
      }
    })
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button disabled={isPending} loading={isPending} />}>
        Join Tournament
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How do you want to join?</DialogTitle>
          <DialogDescription>
            Everyone who joins gets support points to back players in matches — playing just also
            puts you in the bracket.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-1 p-4 text-left whitespace-normal"
            disabled={isPending}
            loading={isPending}
            onClick={() => handleJoin(true)}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Swords className="size-4 text-primary" />
              Play
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Compete in the bracket — you&apos;ll also get support points automatically.
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
              Support only
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Not competing — just get support points to back other players.
            </span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col items-start gap-1 p-4 text-left whitespace-normal"
            disabled={isPending}
            loading={isPending}
            onClick={() => handleJoin(true)}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Layers className="size-4 text-primary" />
              Both
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Compete in the bracket and back other players too.
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

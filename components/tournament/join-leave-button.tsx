"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Tournament } from "@prisma/client"

import { joinTournament, leaveTournament } from "@/lib/actions/tournaments"
import { Button } from "@/components/ui/button"

export function JoinLeaveButton({
  tournament,
  isParticipant,
}: {
  tournament: Pick<Tournament, "id" | "status" | "registrationClose">
  isParticipant: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const canAct =
    tournament.status === "REGISTRATION_OPEN" && new Date() <= tournament.registrationClose

  if (!canAct) return null

  function handleJoin() {
    startTransition(async () => {
      try {
        await joinTournament(tournament.id)
        toast.success("You're in! Good luck.")
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

  return isParticipant ? (
    <Button variant="destructive" disabled={isPending} onClick={handleLeave}>
      Leave Tournament
    </Button>
  ) : (
    <Button disabled={isPending} onClick={handleJoin}>
      Join Tournament
    </Button>
  )
}

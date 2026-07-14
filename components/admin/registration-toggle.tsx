"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { TournamentStatus } from "@prisma/client"

import { closeRegistration, openRegistration } from "@/lib/actions/tournaments"
import { Button } from "@/components/ui/button"

export function RegistrationToggle({
  tournamentId,
  status,
}: {
  tournamentId: string
  status: TournamentStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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

  if (status === "DRAFT") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        loading={isPending}
        onClick={() => run(() => openRegistration(tournamentId), "Registration opened")}
      >
        Open Registration
      </Button>
    )
  }

  if (status === "REGISTRATION_OPEN") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        loading={isPending}
        onClick={() => run(() => closeRegistration(tournamentId), "Registration closed")}
      >
        Close Registration
      </Button>
    )
  }

  return null
}

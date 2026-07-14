"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { X } from "lucide-react"

import { removeParticipant } from "@/lib/actions/participants"
import { Button } from "@/components/ui/button"

export function RemoveParticipantButton({
  tournamentId,
  participantId,
}: {
  tournamentId: string
  participantId: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          try {
            await removeParticipant(tournamentId, participantId)
            toast.success("Participant removed")
            router.refresh()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't remove participant")
          }
        })
      }
    >
      <X className="size-4" />
    </Button>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Ban } from "lucide-react"

import { disqualifyParticipant } from "@/lib/actions/matches"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export function DisqualifyParticipantButton({
  tournamentId,
  participantId,
  participantName,
}: {
  tournamentId: string
  participantId: string
  participantName: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Ban className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Disqualify {participantName}?</DialogTitle>
          <DialogDescription>
            If they&apos;re in a live or scheduled match, their opponent automatically wins by
            forfeit and advances. This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await disqualifyParticipant(tournamentId, participantId)
                  toast.success("Participant disqualified")
                  setOpen(false)
                  router.refresh()
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Couldn't disqualify")
                }
              })
            }
          >
            Disqualify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

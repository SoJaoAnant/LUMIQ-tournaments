"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { RotateCcw } from "lucide-react"

import { resetTournament } from "@/lib/actions/developer"
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

export function ResetTournamentButton({ tournamentId }: { tournamentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <RotateCcw className="size-3.5" />
        Reset
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset this tournament?</DialogTitle>
          <DialogDescription>
            Deletes every match, bet, and wallet, and un-eliminates all participants back to
            round 1. Participants themselves stay registered so the bracket can be regenerated.
            This can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await resetTournament(tournamentId)
                  toast.success("Tournament reset")
                  setOpen(false)
                  router.refresh()
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Couldn't reset tournament")
                }
              })
            }
          >
            Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Shuffle } from "lucide-react"

import { generateBracket } from "@/lib/actions/bracket"
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

export function GenerateBracketButton({
  tournamentId,
  participantCount,
}: {
  tournamentId: string
  participantCount: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button disabled={participantCount < 2} />}>
        <Shuffle className="size-4" />
        Generate Bracket
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate the bracket?</DialogTitle>
          <DialogDescription>
            This randomly seeds all {participantCount} participants into a single-elimination
            bracket and can&apos;t be undone. No more participants can be added afterward.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending}
            loading={isPending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await generateBracket(tournamentId)
                  toast.success("Bracket generated")
                  setOpen(false)
                  router.refresh()
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Couldn't generate bracket")
                }
              })
            }
          >
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

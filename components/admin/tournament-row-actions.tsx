"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import type { TournamentStatus } from "@prisma/client"

import {
  closeRegistration,
  deleteTournament,
  openRegistration,
} from "@/lib/actions/tournaments"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function TournamentRowActions({
  tournamentId,
  status,
}: {
  tournamentId: string
  status: TournamentStatus
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  function run(action: () => Promise<unknown>, successMessage: string) {
    startTransition(async () => {
      try {
        await action()
        toast.success(successMessage)
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong")
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/tournaments/${tournamentId}/edit`} />}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href={`/admin/tournaments/${tournamentId}/participants`} />}
          >
            Participants
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/admin/tournaments/${tournamentId}/bracket`} />}>
            Bracket
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/admin/tournaments/${tournamentId}/matches`} />}>
            Matches
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/admin/tournaments/${tournamentId}/betting`} />}>
            Betting Stats
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/admin/tournaments/${tournamentId}/export`} />}>
            Export CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === "DRAFT" && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => run(() => openRegistration(tournamentId), "Registration opened")}
            >
              Open Registration
            </DropdownMenuItem>
          )}
          {status === "REGISTRATION_OPEN" && (
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => run(() => closeRegistration(tournamentId), "Registration closed")}
            >
              Close Registration
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setConfirmOpen(true)}>
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this tournament?</DialogTitle>
            <DialogDescription>
              This permanently deletes the tournament, its participants, matches, and bets. This
              can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isPending}
              onClick={() => {
                run(() => deleteTournament(tournamentId), "Tournament deleted")
                setConfirmOpen(false)
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

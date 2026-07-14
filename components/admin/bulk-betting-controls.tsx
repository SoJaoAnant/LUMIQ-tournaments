"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Ticket, TicketSlash } from "lucide-react"

import { closeAllBetting, openAllBetting } from "@/lib/actions/matches"
import { Button } from "@/components/ui/button"

export function BulkBettingControls({
  tournamentId,
  eligibleCount,
  openCount,
}: {
  tournamentId: string
  eligibleCount: number
  openCount: number
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending || eligibleCount === 0}
        loading={isPending}
        onClick={() =>
          run(
            () => openAllBetting(tournamentId),
            `Betting opened on ${eligibleCount} match${eligibleCount === 1 ? "" : "es"}`
          )
        }
      >
        <Ticket className="size-3.5" />
        Open betting — all eligible ({eligibleCount})
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending || openCount === 0}
        loading={isPending}
        onClick={() =>
          run(
            () => closeAllBetting(tournamentId),
            `Betting closed on ${openCount} match${openCount === 1 ? "" : "es"}`
          )
        }
      >
        <TicketSlash className="size-3.5" />
        Close betting — all open ({openCount})
      </Button>
    </div>
  )
}

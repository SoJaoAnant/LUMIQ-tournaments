"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Ticket, TicketSlash } from "lucide-react"

import { closeAllSupport, openAllSupport } from "@/lib/actions/matches"
import { Button } from "@/components/ui/button"

export function BulkSupportControls({
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
            () => openAllSupport(tournamentId),
            `Support opened on ${eligibleCount} match${eligibleCount === 1 ? "" : "es"}`
          )
        }
      >
        <Ticket className="size-3.5" />
        Open support — all eligible ({eligibleCount})
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending || openCount === 0}
        loading={isPending}
        onClick={() =>
          run(
            () => closeAllSupport(tournamentId),
            `Support closed on ${openCount} match${openCount === 1 ? "" : "es"}`
          )
        }
      >
        <TicketSlash className="size-3.5" />
        Close support — all open ({openCount})
      </Button>
    </div>
  )
}

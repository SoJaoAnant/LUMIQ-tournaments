import type { MatchStatus } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const LABEL: Record<MatchStatus, string> = {
  SCHEDULED: "Scheduled",
  BETTING_OPEN: "Betting Open",
  LIVE: "Live",
  FINISHED: "Finished",
}

const CLASS: Record<MatchStatus, string> = {
  SCHEDULED: "bg-muted-foreground/10 text-muted-foreground",
  BETTING_OPEN: "bg-secondary/40 text-secondary-foreground",
  LIVE: "bg-accent/15 text-accent animate-pulse",
  FINISHED: "bg-primary/15 text-primary",
}

export function MatchStatusBadge({ status }: { status: MatchStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-full border-transparent font-semibold", CLASS[status])}>
      {LABEL[status]}
    </Badge>
  )
}

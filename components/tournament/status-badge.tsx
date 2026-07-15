import type { TournamentStatus } from "@prisma/client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const STATUS_LABEL: Record<TournamentStatus, string> = {
  DRAFT: "Draft",
  REGISTRATION_OPEN: "Registration Open",
  REGISTRATION_CLOSED: "Registration Closed",
  BRACKET_GENERATED: "Bracket Generated",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
}

const STATUS_CLASS: Record<TournamentStatus, string> = {
  DRAFT: "bg-muted-foreground/10 text-muted-foreground",
  REGISTRATION_OPEN: "bg-secondary/40 text-secondary-foreground",
  REGISTRATION_CLOSED: "bg-secondary/25 text-secondary-foreground",
  BRACKET_GENERATED: "bg-primary/12 text-primary",
  IN_PROGRESS: "bg-accent/15 text-accent",
  COMPLETED: "bg-primary/15 text-primary",
  ARCHIVED: "bg-muted-foreground/10 text-muted-foreground",
}

export function TournamentStatusBadge({ status }: { status: TournamentStatus }) {
  return (
    <Badge variant="outline" className={cn("rounded-full border-transparent font-semibold", STATUS_CLASS[status])}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}

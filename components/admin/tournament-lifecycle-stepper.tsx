import { Check } from "lucide-react"
import type { TournamentStatus } from "@prisma/client"

import { cn } from "@/lib/utils"

const STEPS: { status: TournamentStatus; label: string }[] = [
  { status: "DRAFT", label: "Draft" },
  { status: "REGISTRATION_OPEN", label: "Registration Open" },
  { status: "REGISTRATION_CLOSED", label: "Registration Closed" },
  { status: "BRACKET_GENERATED", label: "Bracket Generated" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "COMPLETED", label: "Completed" },
  { status: "ARCHIVED", label: "Archived" },
]

export function TournamentLifecycleStepper({ status }: { status: TournamentStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.status === status)

  return (
    <div className="no-scrollbar w-full overflow-x-auto pb-1">
      <ol className="flex w-max min-w-full items-start sm:w-full">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex
          const isCurrent = i === currentIndex
          const isLast = i === STEPS.length - 1

          return (
            <li key={step.status} className={cn("flex items-center", !isLast && "flex-1")}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold transition-colors",
                    isDone && "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary shadow-[0_0_0_4px_rgba(137,140,236,0.15)]",
                    !isDone && !isCurrent && "border-border bg-background text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="size-3.5" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "max-w-20 text-center text-[10px] leading-tight font-medium whitespace-nowrap sm:max-w-24 sm:text-xs",
                    isCurrent && "font-semibold text-primary",
                    !isCurrent && !isDone && "text-muted-foreground",
                    isDone && "text-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-1 mt-3.5 h-0.5 min-w-6 flex-1 rounded-full transition-colors sm:mx-2",
                    isDone ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

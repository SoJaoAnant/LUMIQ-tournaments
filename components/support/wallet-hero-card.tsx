import { cn } from "@/lib/utils"

export function WalletHeroCard({
  points,
  correct,
  incorrect,
}: {
  points: number | null | undefined
  correct: number
  incorrect: number
}) {
  const isNegative = (points ?? 0) < 0

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        isNegative
          ? "border-destructive/30 bg-gradient-to-br from-destructive/10 to-card"
          : "border-amber-200/70 bg-gradient-to-br from-amber-50 to-white dark:border-amber-900/40 dark:from-amber-950/30 dark:to-card"
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold",
          isNegative ? "text-destructive/80" : "text-amber-700/80 dark:text-amber-400/70"
        )}
      >
        Support wallet
      </p>
      <div className="mt-2 flex items-end gap-2">
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full shadow-inner",
            isNegative
              ? "bg-[radial-gradient(circle_at_35%_30%,#fca5a5,#ef4444_68%,#b91c1c)]"
              : "bg-[radial-gradient(circle_at_35%_30%,#fbe6a0,#e9b949_68%,#c8971f)]"
          )}
        >
          <span className={cn("font-heading text-sm font-bold", isNegative ? "text-red-50" : "text-amber-900")}>
            {isNegative ? "!" : "P"}
          </span>
        </div>
        <span
          className={cn(
            "font-heading text-3xl font-extrabold",
            isNegative ? "text-destructive" : "text-amber-800 dark:text-amber-300"
          )}
        >
          {points ?? "—"}
        </span>
        <span
          className={cn(
            "mb-1 text-xs",
            isNegative ? "text-destructive/70" : "text-amber-700/70 dark:text-amber-400/70"
          )}
        >
          points, this cup
        </span>
      </div>
      {isNegative && (
        <p className="mt-1.5 text-xs font-medium text-destructive">
          In the red — back a winner to climb back out.
        </p>
      )}
      <div
        className={cn(
          "mt-4 grid grid-cols-2 gap-3 border-t pt-3",
          isNegative ? "border-destructive/20" : "border-amber-200/60 dark:border-amber-900/40"
        )}
      >
        <div>
          <p className="text-xs text-muted-foreground">Correct</p>
          <p className="font-heading text-lg font-bold text-[#2C9E6E]">{correct}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Missed</p>
          <p className="font-heading text-lg font-bold text-destructive">{incorrect}</p>
        </div>
      </div>
    </div>
  )
}

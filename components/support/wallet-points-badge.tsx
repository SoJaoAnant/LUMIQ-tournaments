import { cn } from "@/lib/utils"

export function WalletPointsBadge({
  points,
  label = "support points",
  size = "default",
  className,
}: {
  points: number | null | undefined
  label?: string
  size?: "default" | "sm"
  className?: string
}) {
  const isSm = size === "sm"
  const isNegative = (points ?? 0) < 0

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border shadow-sm",
        isNegative
          ? "border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 shadow-destructive/20"
          : "border-amber-200/70 bg-gradient-to-br from-amber-50 to-amber-50/40 shadow-amber-300/30 dark:border-amber-900/40 dark:from-amber-950/40 dark:to-amber-950/10",
        isSm ? "py-1 pr-3 pl-1" : "py-1.5 pr-4 pl-1.5",
        className
      )}
    >
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-full shadow-inner",
          isNegative
            ? "bg-[radial-gradient(circle_at_35%_30%,#fca5a5,#ef4444_68%,#b91c1c)]"
            : "bg-[radial-gradient(circle_at_35%_30%,#fbe6a0,#e9b949_68%,#c8971f)]",
          isSm ? "size-5" : "size-7"
        )}
      >
        <span
          className={cn(
            "font-heading font-bold",
            isNegative ? "text-red-50" : "text-amber-900",
            isSm ? "text-[9px]" : "text-xs"
          )}
        >
          {isNegative ? "!" : "P"}
        </span>
      </div>
      <div className="leading-tight">
        <span
          className={cn(
            "font-heading font-bold",
            isNegative ? "text-destructive" : "text-amber-800 dark:text-amber-300",
            isSm ? "text-sm" : "text-lg"
          )}
        >
          {points ?? "—"}
        </span>
        <span
          className={cn(
            "ml-1.5 font-medium",
            isNegative ? "text-destructive/70" : "text-amber-700/70 dark:text-amber-400/70",
            isSm ? "text-[10px]" : "text-xs"
          )}
        >
          {label}
        </span>
      </div>
    </div>
  )
}

export function WalletHeroCard({
  points,
  correct,
  incorrect,
}: {
  points: number | null | undefined
  correct: number
  incorrect: number
}) {
  return (
    <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:to-card">
      <p className="text-xs font-semibold text-amber-700/80 dark:text-amber-400/70">Betting wallet</p>
      <div className="mt-2 flex items-end gap-2">
        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fbe6a0,#e9b949_68%,#c8971f)] shadow-inner">
          <span className="font-heading text-sm font-bold text-amber-900">P</span>
        </div>
        <span className="font-heading text-3xl font-extrabold text-amber-800 dark:text-amber-300">
          {points ?? "—"}
        </span>
        <span className="mb-1 text-xs text-amber-700/70 dark:text-amber-400/70">points, this cup</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-amber-200/60 pt-3 dark:border-amber-900/40">
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

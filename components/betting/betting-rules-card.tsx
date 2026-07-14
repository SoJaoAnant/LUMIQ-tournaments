export function BettingRulesCard({
  rounds,
  initialPoints,
}: {
  rounds: number | null
  initialPoints: number | null
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="mb-2 font-heading text-sm font-bold">How points work</h3>
      <ul className="flex flex-col gap-1.5 text-sm text-muted-foreground">
        <li>One bet per match, and you can&apos;t back both players.</li>
        <li>Bets lock the instant a match goes live — no edits after that.</li>
        <li>
          Stakes rise with the round — 1 point in round 1, 2 in round 2, 3 in round 3, and so on.
          Correct picks return double the stake; wrong ones lose it, even into negative points.
        </li>
        {initialPoints !== null && rounds !== null && (
          <li>
            You started this cup with{" "}
            <strong className="text-foreground">{initialPoints} points</strong> — enough to bet
            every one of the {rounds} round{rounds === 1 ? "" : "s"} and lose every time, plus a
            small cushion.
          </li>
        )}
      </ul>
    </div>
  )
}

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
          Correct picks return <strong className="text-foreground">+2</strong>, wrong ones cost the
          1 point staked.
        </li>
        {initialPoints !== null && rounds !== null && (
          <li>
            You started this cup with{" "}
            <strong className="text-foreground">{initialPoints} points</strong> ({rounds} rounds +
            5).
          </li>
        )}
      </ul>
    </div>
  )
}

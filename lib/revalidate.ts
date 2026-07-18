import { revalidatePath } from "next/cache"

/**
 * Revalidates every page that shows this tournament's state — both the
 * detail pages and the browse/manage list pages. Anything that changes a
 * tournament's status or bracket (registration toggles, bracket generation,
 * match results, resets, overrides) should call this so other users don't
 * see stale data.
 */
export function revalidateTournamentPaths(tournamentId: string) {
  const base = `/tournaments/${tournamentId}`

  ;[
    base,
    `${base}/bracket`,
    `${base}/support`,
    `${base}/leaderboard`,
    `${base}/info`,
    `${base}/manage`,
    `${base}/results`,
  ].forEach((path) => revalidatePath(path))

  revalidatePath("/tournaments")
  revalidatePath("/admin/tournaments")
  revalidatePath("/developer/tournaments")
  revalidatePath("/dashboard")
}

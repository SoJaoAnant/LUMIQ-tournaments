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
  const adminBase = `/admin/tournaments/${tournamentId}`

  ;[
    base,
    `${base}/bracket`,
    `${base}/betting`,
    `${base}/leaderboard`,
    `${base}/info`,
    `${base}/results`,
    adminBase,
    `${adminBase}/edit`,
    `${adminBase}/bracket`,
    `${adminBase}/matches`,
    `${adminBase}/participants`,
    `${adminBase}/betting`,
    `${adminBase}/export`,
  ].forEach((path) => revalidatePath(path))

  revalidatePath("/tournaments")
  revalidatePath("/admin/tournaments")
  revalidatePath("/developer/tournaments")
  revalidatePath("/dashboard")
}

import Link from "next/link"
import { notFound } from "next/navigation"
import { Megaphone, Sparkles, Trophy } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getMyParticipation, getTournament } from "@/lib/data/tournaments"
import { getBracketData, getFeaturedMatch } from "@/lib/data/bracket"
import { timeAgo } from "@/lib/format"
import { hasAtLeastRole } from "@/lib/rbac"
import { HeroMatchCard } from "@/components/tournament/hero-match-card"
import { AnnouncementForm } from "@/components/tournament/announcement-form"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"

export default async function TournamentOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params

  const tournament = await getTournament(id)
  if (!tournament) notFound()

  const [participation, { matches, players }, announcements] = await Promise.all([
    getMyParticipation(id, user.id),
    getBracketData(id),
    db.announcement.findMany({
      where: { tournamentId: id },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ])

  const totalRounds = matches.length ? Math.max(...matches.map((m) => m.round)) : 0
  const featured = matches.length ? getFeaturedMatch(matches) : null

  const showResultsLink = tournament.status === "COMPLETED" || tournament.status === "ARCHIVED"
  const canSeeAnnouncements = hasAtLeastRole(user.role, "ADMIN")

  return (
    <div className={cn("grid min-w-0 gap-4", canSeeAnnouncements && "lg:grid-cols-[1.55fr_1fr]")}>
      <div className="flex min-w-0 flex-col gap-4">
        {showResultsLink ? (
          <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#7A7DE8,#898CEC_45%,#E583BA)] p-6 text-white shadow-lg shadow-primary/25 sm:p-8">
            <div className="pointer-events-none absolute -top-12 -right-12 size-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
              <Trophy className="size-3.5" />
              Tournament ended
            </div>
            <p className="relative mt-4 font-heading text-2xl font-bold sm:text-3xl">
              This cup has wrapped up
            </p>
            <p className="relative mt-1 text-sm text-white/80">
              See who took the trophy and who was the best bettor of this tournament.
            </p>
            <Link
              href={`/tournaments/${id}/results`}
              className="relative mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-primary shadow-sm transition-transform hover:scale-[1.01]"
            >
              <Sparkles className="size-4" />
              View results — see who won →
            </Link>
          </div>
        ) : featured ? (
          <HeroMatchCard
            tournamentId={id}
            match={featured}
            players={players}
            totalRounds={totalRounds}
            myParticipantId={participation?.id ?? null}
          />
        ) : (
          <EmptyState
            icon={Trophy}
            title="Bracket not generated yet"
            description="Once registration closes and an admin generates the bracket, the first matches will show up here."
          />
        )}
      </div>

      {canSeeAnnouncements && (
        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold">
              <Megaphone className="size-4 text-primary" />
              Announcements
            </h2>

            <div className="mb-4 border-b border-border pb-4">
              <AnnouncementForm tournamentId={id} />
            </div>

            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {announcements.map((a) => (
                  <li key={a.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{a.title}</p>
                      <p className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.createdAt)}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{a.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

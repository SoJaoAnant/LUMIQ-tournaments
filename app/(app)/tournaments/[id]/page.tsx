import Link from "next/link"
import { notFound } from "next/navigation"
import { Megaphone, Sparkles, Trophy } from "lucide-react"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getMyParticipation, getTournament } from "@/lib/data/tournaments"
import { getBracketData, getFeaturedMatch } from "@/lib/data/bracket"
import { getRoundAbbrev } from "@/lib/bracket"
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

  const myMatches = participation
    ? matches
        .filter(
          (m) =>
            !m.isThirdPlaceMatch && (m.player1Id === participation.id || m.player2Id === participation.id)
        )
        .sort((a, b) => a.round - b.round)
    : []

  const showResultsLink = tournament.status === "COMPLETED" || tournament.status === "ARCHIVED"

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[1.55fr_1fr]">
      <div className="flex min-w-0 flex-col gap-4">
        {featured ? (
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

        {participation && myMatches.length > 0 && (
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-heading text-base font-bold">Your run to the final</h2>
              <Link
                href={`/tournaments/${id}/bracket`}
                className="text-sm font-semibold text-primary hover:underline"
              >
                Full bracket →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {myMatches.map((m) => {
                const opponentId = m.player1Id === participation.id ? m.player2Id : m.player1Id
                const opponent = opponentId ? players[opponentId] : undefined
                const finished = m.status === "FINISHED"
                const won = finished && m.winnerId === participation.id
                const resultLabel = m.isBye
                  ? "Bye"
                  : finished
                    ? won
                      ? "Won"
                      : "Lost"
                    : m.status === "LIVE"
                      ? "Live now"
                      : "Upcoming"

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm",
                      finished && won && "bg-[#3FBF87]/10",
                      finished && !won && "bg-muted/50 opacity-70",
                      !finished && "bg-accent/8"
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[11px] font-bold text-primary">
                        {getRoundAbbrev(m.round, totalRounds)}
                      </span>
                      <span className="truncate font-medium">
                        {opponent ? `vs ${opponent.name}` : m.isBye ? "Bye" : "TBD"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 text-xs font-semibold",
                        finished && won && "text-[#2C9E6E]",
                        finished && !won && "text-muted-foreground",
                        !finished && "text-accent"
                      )}
                    >
                      {resultLabel}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 font-heading text-base font-bold">
            <Megaphone className="size-4 text-primary" />
            Announcements
          </h2>

          {hasAtLeastRole(user.role, "ADMIN") && (
            <div className="mb-4 border-b border-border pb-4">
              <AnnouncementForm tournamentId={id} />
            </div>
          )}

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

        {showResultsLink && (
          <Link
            href={`/tournaments/${id}/results`}
            className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/50 bg-accent/5 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent/10"
          >
            <Sparkles className="size-4" />
            Preview the winners reveal →
          </Link>
        )}
      </div>
    </div>
  )
}

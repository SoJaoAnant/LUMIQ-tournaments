# Tournament Hosting Webapp — Architecture

> Internal tool for a ~500-employee company. See [CLAUDE.md](../CLAUDE.md) for the original product spec this design implements.

## 1. System Architecture

- **Next.js 15 App Router**, TypeScript, all data reads via **React Server Components** calling Prisma directly (no client-side data-fetching library needed for primary data).
- **Mutations via Server Actions** in `lib/actions/*`, validated with **Zod**, revalidating paths/tags on success. No tRPC — Server Actions alone give full type safety at this scale.
- **Auth**: Clerk, email + password. Sign-up requires email, password, and full name (first + last), and the email must be confirmed via a verification code before the account is usable — all enforced in the Clerk Dashboard's auth settings, not in our code. No company-domain restriction — any email can sign up (the earlier Microsoft OAuth + `@lumiq.ai`-only design was dropped; see CLAUDE.md's login section for why). `clerkMiddleware` wraps every route to make `auth()`/`currentUser()` available; it does not itself gate access. A Clerk webhook (`/api/webhooks/clerk`) upserts our `User` row on `user.created`/`user.updated` — this is how "first login creates the account, subsequent logins reuse it" is implemented server-side rather than relying on client redirect logic.
- **Role storage**: role lives in **our Postgres `User.role`**, not Clerk metadata — avoids metadata/DB drift. Every protected layout/page/server action re-checks role server-side; UI hiding is never trusted alone.
- **DB**: Neon Postgres via Prisma. `DATABASE_URL` (pooled, `-pooler` host) for runtime queries, `DIRECT_URL` (unpooled) for `prisma migrate` — the standard Neon+Prisma pattern.
- **"Live-ish" data** (support counts, leaderboards, match status): Next.js revalidation + manual refresh. No WebSockets — unnecessary at this scale; a `useSWR` polling upgrade path is noted in code comments where relevant.

## 2. Prisma Schema

See [prisma/schema.prisma](../prisma/schema.prisma) for the authoritative source. Summary of models: `User`, `Tournament`, `Participant`, `Match`, `Support`, `TournamentWallet`, `Announcement`, `AuditLog`, `FeatureFlag`.

Key design decisions:
- `TournamentStatus` is coarse (`DRAFT → REGISTRATION_OPEN → REGISTRATION_CLOSED → BRACKET_GENERATED → IN_PROGRESS → COMPLETED → ARCHIVED`). The spec's literal per-match "Support Open / Match Live / Match Finished" cycle is tracked per-**match** via `MatchStatus` (`SCHEDULED → SUPPORT_OPEN → LIVE → FINISHED`), since multiple matches in the same round run concurrently in a real bracket — a single tournament-wide field can't represent that.
- `Match.nextMatchId`/`nextMatchSlot` and `loserToMatchId`/`loserToSlot` are the wiring that drives automatic bracket advancement and the 3rd-place decider match.
- `TournamentWallet.currentPoints` is initialized at **bracket-generation time**, not at join time — the final participant count (hence `rounds`, hence `N`) is only known once registration closes.
- `Match.isBye` marks auto-advanced matches (odd participant counts); `isThirdPlaceMatch` marks the bronze-medal match, generated whenever a semifinal round exists (`rounds >= 2`).

## 3. RBAC Model

| Capability | User | Admin | Developer |
|---|:---:|:---:|:---:|
| Join/leave tournament, support, view leaderboards/bracket/schedule | ✅ | ✅ | ✅ |
| Create/edit/delete tournament, manage participants, generate bracket, schedule matches, open/close support, enter results, disqualify, publish announcements | ❌ | ✅ | ✅ |
| Create/delete admins, view audit logs, reset tournaments, override match results, manage feature flags | ❌ | ❌ | ✅ |

Enforcement layers (defense in depth):
1. `middleware.ts` — makes Clerk's auth context available to every route; no gating logic itself.
2. Route-group layouts (`app/(admin)/layout.tsx`, `app/(developer)/layout.tsx`) — coarse redirect if role insufficient.
3. Every Server Action calls `requireRole(minRole)` from `lib/auth.ts` before touching the DB — the real enforcement boundary.
4. Every admin/developer mutation writes an `AuditLog` row via a `withAudit()` wrapper.

## 4. UI Page Hierarchy

```
(public)/sign-in/[[...sign-in]]         Clerk hosted sign-in (email + password)
(public)/sign-up/[[...sign-up]]         Clerk hosted sign-up (email, password, full name + email verification)
(public)/unauthorized                    shown if a Clerk session has no matching/usable User row
(app)/dashboard                          my tournaments, my support, active support windows
(app)/tournaments                        browse all tournaments
(app)/tournaments/[id]/                  tab shell: Overview · Bracket · Participants ·
                                          Upcoming Matches · Support · Leaderboard ·
                                          Support Leaderboard · Announcements · Rules · Results
(app)/profile                            my info, my support history across tournaments
(admin)/admin/                           tournaments (CRUD), participants, bracket gen,
                                          matches, support stats, announcements, CSV export
(developer)/developer/                   admins mgmt, audit logs, tournament reset/delete/
                                          override, feature flags
api/webhooks/clerk                       Clerk user sync webhook
```

## 5. Component Hierarchy

```
components/
  ui/            shadcn primitives
  layout/        AppShell, Sidebar, Topbar, MobileNav, TournamentTabs
  tournament/    TournamentCard, StatusBadge, OverviewPanel, RulesPanel, AnnouncementsFeed
  bracket/       BracketView (desktop tree), BracketMobileList, MatchNode, RoundColumn
  participants/  ParticipantsTable, ImportParticipantsDialog, SeedBadge
  matches/       MatchCard, MatchList, ScheduleMatchDialog, EnterResultDialog
  support/       SupportDialog, SupportHistoryTable, WalletPointsBadge, SupportLockCountdown
  leaderboard/   LeaderboardTable, SupportLeaderboardTable, RankBadge
  results/       WinnersPodium, BestSupporterCard
  admin/         TournamentForm, SupportStatsPanel, CSVExportButton
  developer/     AdminManagementTable, AuditLogTable, TournamentResetDialog, FeatureFlagToggle
  shared/        DataTable, EmptyState, ConfirmDialog, PageHeader
```

## 6. State Management Strategy

- Server state: fetched in RSCs directly via Prisma — no client cache library.
- Mutations: Server Actions + `revalidatePath`/`revalidateTag`.
- Client-only ephemeral UI state (dialog open/close, bracket view toggle, mobile nav): local `useState`/small Context — no Redux/Zustand needed at this scale.
- Forms: `react-hook-form` + `@hookform/resolvers/zod`, sharing the same Zod schemas used server-side in `lib/validations/*`.

## 7. Folder Structure

```
app/
  (public)/sign-in/[[...sign-in]]/page.tsx
  (public)/unauthorized/page.tsx
  (app)/dashboard/page.tsx
  (app)/tournaments/page.tsx
  (app)/tournaments/[id]/{layout,page,bracket,participants,matches,support,leaderboard,support-leaderboard,announcements,rules,results}
  (app)/profile/page.tsx
  (admin)/admin/{layout,page,tournaments,...}
  (developer)/developer/{layout,page,admins,audit-logs,tournaments,feature-flags}
  api/webhooks/clerk/route.ts
  layout.tsx, globals.css
components/{ui,layout,tournament,bracket,participants,matches,support,leaderboard,results,admin,developer,shared}/
lib/
  db.ts               Prisma client singleton
  auth.ts             getCurrentUser, requireAuth, requireRole
  rbac.ts              permission matrix
  bracket.ts           bracket generation + advancement algorithm
  support.ts           points math helpers
  csv.ts               CSV export
  utils.ts             cn() etc.
  validations/*.ts     Zod schemas (shared client+server)
  actions/*.ts         Server Actions (tournaments, participants, matches, support, announcements, admin, developer)
prisma/schema.prisma, seed.ts
docs/ARCHITECTURE.md   this file
middleware.ts
.env.example
```

## 8. Bracket Generation & Support Math

`lib/bracket.ts`:
- `rounds = ceil(log2(N))`, `bracketSize = 2^rounds`, `byes = bracketSize - N`.
- Fisher-Yates shuffle participants (fully random per spec, not skill-seeded), assign byes randomly among the shuffled set, pair into round 1 matches. A participant with a bye auto-advances (`Match.isBye = true`, `status = FINISHED`, `winnerId` set immediately).
- Generate empty shells for subsequent rounds with `nextMatchId`/`nextMatchSlot` wiring from round *r* → round *r+1*.
- If `rounds >= 2`, generate one extra final-round match (`isThirdPlaceMatch = true`); wire the two semifinal matches' `loserToMatchId`/`loserToSlot` into it. A bye semifinal has no real loser — handled gracefully.
- On declaring a match winner: propagate winner into `nextMatchId` slot, propagate loser into `loserToMatchId` slot if set, resolve all support on that match, update wallets.

`lib/support.ts`:
- Initial points set on every `TournamentWallet` at bracket-generation time (see `getInitialWalletPoints` — the triangular sum of round stakes plus a cushion).
- Each round's stake scales with the round number (blocked if `currentPoints < 1`), correct prediction returns double the stake, wrong prediction returns `0` (net effect: the spent points are not refunded).
- Tournament completion: `winnerParticipantId`/`runnerUpParticipantId` from the final match, `thirdPlaceParticipantId` from the 3rd-place match; `bestSupporterId` = highest `TournamentWallet.currentPoints`, tie-broken by accuracy % then correct-support count.

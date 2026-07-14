# Tournament Hosting Webapp — Architecture

> Internal tool for a ~500-employee company. See [CLAUDE.md](../CLAUDE.md) for the original product spec this design implements.

## 1. System Architecture

- **Next.js 15 App Router**, TypeScript, all data reads via **React Server Components** calling Prisma directly (no client-side data-fetching library needed for primary data).
- **Mutations via Server Actions** in `lib/actions/*`, validated with **Zod**, revalidating paths/tags on success. No tRPC — Server Actions alone give full type safety at this scale.
- **Auth**: Clerk, Microsoft (Entra ID) OAuth only — matches the company's Microsoft 365 tenant, so signing in with a work Microsoft account is equivalent to proving ownership of the company email. Restricted to the `@lumiq.ai` domain. `clerkMiddleware` protects all routes except sign-in and the Clerk webhook. A Clerk webhook (`/api/webhooks/clerk`) upserts our `User` row on `user.created`/`user.updated` — this is how "first login creates the account, subsequent logins reuse it" is implemented server-side rather than relying on client redirect logic. Email-domain restriction is enforced twice: once ideally at the Microsoft/Azure AD app-registration level (single-tenant, restricting login to the company's own tenant) and again defensively in code, in the webhook handler and in `lib/auth.ts` — the code-level check is what actually gates access today, since Clerk's shared dev-mode Microsoft connection doesn't restrict by tenant.
- **Role storage**: role lives in **our Postgres `User.role`**, not Clerk metadata — avoids metadata/DB drift. Every protected layout/page/server action re-checks role server-side; UI hiding is never trusted alone.
- **DB**: Neon Postgres via Prisma. `DATABASE_URL` (pooled, `-pooler` host) for runtime queries, `DIRECT_URL` (unpooled) for `prisma migrate` — the standard Neon+Prisma pattern.
- **"Live-ish" data** (betting counts, leaderboards, match status): Next.js revalidation + manual refresh. No WebSockets — unnecessary at this scale; a `useSWR` polling upgrade path is noted in code comments where relevant.

## 2. Prisma Schema

See [prisma/schema.prisma](../prisma/schema.prisma) for the authoritative source. Summary of models: `User`, `Tournament`, `Participant`, `Match`, `Bet`, `TournamentWallet`, `Announcement`, `AuditLog`, `FeatureFlag`.

Key design decisions:
- `TournamentStatus` is coarse (`DRAFT → REGISTRATION_OPEN → REGISTRATION_CLOSED → BRACKET_GENERATED → IN_PROGRESS → COMPLETED → ARCHIVED`). The spec's literal per-match "Betting Open / Match Live / Match Finished" cycle is tracked per-**match** via `MatchStatus` (`SCHEDULED → BETTING_OPEN → LIVE → FINISHED`), since multiple matches in the same round run concurrently in a real bracket — a single tournament-wide field can't represent that.
- `Match.nextMatchId`/`nextMatchSlot` and `loserToMatchId`/`loserToSlot` are the wiring that drives automatic bracket advancement and the 3rd-place decider match.
- `TournamentWallet.currentPoints` is initialized at **bracket-generation time**, not at join time — the final participant count (hence `rounds`, hence `N`) is only known once registration closes.
- `Match.isBye` marks auto-advanced matches (odd participant counts); `isThirdPlaceMatch` marks the bronze-medal match, generated whenever a semifinal round exists (`rounds >= 2`).

## 3. RBAC Model

| Capability | User | Admin | Developer |
|---|:---:|:---:|:---:|
| Join/leave tournament, bet, view leaderboards/bracket/schedule | ✅ | ✅ | ✅ |
| Create/edit/delete tournament, manage participants, generate bracket, schedule matches, open/close betting, enter results, disqualify, publish announcements | ❌ | ✅ | ✅ |
| Create/delete admins, view audit logs, reset tournaments, override match results, manage feature flags | ❌ | ❌ | ✅ |

Enforcement layers (defense in depth):
1. `middleware.ts` — authentication + email-domain check only.
2. Route-group layouts (`app/(admin)/layout.tsx`, `app/(developer)/layout.tsx`) — coarse redirect if role insufficient.
3. Every Server Action calls `requireRole(minRole)` from `lib/auth.ts` before touching the DB — the real enforcement boundary.
4. Every admin/developer mutation writes an `AuditLog` row via a `withAudit()` wrapper.

## 4. UI Page Hierarchy

```
(public)/sign-in/[[...sign-in]]         Clerk hosted sign-in (Microsoft only)
(public)/unauthorized                    shown if non-@lumiq.ai email
(app)/dashboard                          my tournaments, my bets, active betting windows
(app)/tournaments                        browse all tournaments
(app)/tournaments/[id]/                  tab shell: Overview · Bracket · Participants ·
                                          Upcoming Matches · Betting · Leaderboard ·
                                          Betting Leaderboard · Announcements · Rules · Results
(app)/profile                            my info, my bet history across tournaments
(admin)/admin/                           tournaments (CRUD), participants, bracket gen,
                                          matches, betting stats, announcements, CSV export
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
  betting/       BetDialog, BetHistoryTable, WalletPointsBadge, BettingLockCountdown
  leaderboard/   LeaderboardTable, BettingLeaderboardTable, RankBadge
  results/       WinnersPodium, BestBettorCard
  admin/         TournamentForm, BettingStatsPanel, CSVExportButton
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
  (app)/tournaments/[id]/{layout,page,bracket,participants,matches,betting,leaderboard,betting-leaderboard,announcements,rules,results}
  (app)/profile/page.tsx
  (admin)/admin/{layout,page,tournaments,...}
  (developer)/developer/{layout,page,admins,audit-logs,tournaments,feature-flags}
  api/webhooks/clerk/route.ts
  layout.tsx, globals.css
components/{ui,layout,tournament,bracket,participants,matches,betting,leaderboard,results,admin,developer,shared}/
lib/
  db.ts               Prisma client singleton
  auth.ts             getCurrentUser, requireAuth, requireRole
  rbac.ts              permission matrix
  bracket.ts           bracket generation + advancement algorithm
  betting.ts           points math helpers
  csv.ts               CSV export
  utils.ts             cn() etc.
  validations/*.ts     Zod schemas (shared client+server)
  actions/*.ts         Server Actions (tournaments, participants, matches, bets, announcements, admin, developer)
prisma/schema.prisma, seed.ts
docs/ARCHITECTURE.md   this file
middleware.ts
.env.example
```

## 8. Bracket Generation & Betting Math

`lib/bracket.ts`:
- `rounds = ceil(log2(N))`, `bracketSize = 2^rounds`, `byes = bracketSize - N`.
- Fisher-Yates shuffle participants (fully random per spec, not skill-seeded), assign byes randomly among the shuffled set, pair into round 1 matches. A participant with a bye auto-advances (`Match.isBye = true`, `status = FINISHED`, `winnerId` set immediately).
- Generate empty shells for subsequent rounds with `nextMatchId`/`nextMatchSlot` wiring from round *r* → round *r+1*.
- If `rounds >= 2`, generate one extra final-round match (`isThirdPlaceMatch = true`); wire the two semifinal matches' `loserToMatchId`/`loserToSlot` into it. A bye semifinal has no real loser — handled gracefully.
- On declaring a match winner: propagate winner into `nextMatchId` slot, propagate loser into `loserToMatchId` slot if set, resolve all bets on that match, update wallets.

`lib/betting.ts`:
- Initial points `N = rounds + 5`, set on every `TournamentWallet` at bracket-generation time.
- Each bet costs 1 point (blocked if `currentPoints < 1`), correct prediction returns `+2`, wrong prediction returns `0` (net effect: the 1 spent point is not refunded).
- Tournament completion: `winnerParticipantId`/`runnerUpParticipantId` from the final match, `thirdPlaceParticipantId` from the 3rd-place match; `bestBettorId` = highest `TournamentWallet.currentPoints`, tie-broken by accuracy % then correct-bet count.

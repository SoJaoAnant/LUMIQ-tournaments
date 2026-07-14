# Handoff: LUMIQ Arena — Tournament Platform Redesign

## Overview
A gamified, entertaining platform where a company hosts internal tournaments (table tennis, carrom, chess, etc.), lets employees follow brackets, and place light "points" bets on match outcomes. This handoff covers five surfaces: **Dashboard, Tournament detail (Overview / Bracket / Betting / Leaderboard / Info), Winners reveal, and Admin console.** Betting is the hero of the experience.

## About the Design Files
The files in `reference/` are **design references created in HTML** — prototypes showing the intended look and behavior. **They are not production code to copy directly.**

- `reference/Tournament Platform.dc.html` — the source. It uses a proprietary preview runtime (a `<x-dc>` custom element + `support.js`). **Do not try to build on this file or import `support.js`.** Read it only to see exact markup, inline styles, and the logic class (`renderVals()`), which spell out every color, size, and state.
- `reference/LUMIQ Arena (standalone preview).html` — a self-contained bundle. Open it in a browser to *see and click through* the design. It's a flattened blob; **don't read it as source.**

**Your task:** recreate these designs in the target codebase's existing environment (React/Next, Vue, etc.) using its established component patterns, styling approach, and libraries. If no frontend exists yet, choose an appropriate stack (recommended: **React + TypeScript + Tailwind**, or plain CSS modules) and implement there. Wire the UI to the real backend — the prototype uses hardcoded mock data.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are all specified below and in the reference file. Recreate the UI faithfully, but translate it into idiomatic components in your stack rather than copying inline styles verbatim.

---

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| Primary / Indigo | `#898CEC` | Brand primary, buttons, active nav, avatars |
| Primary deep | `#7A7DE8` / `#6D70D6` | Button gradients, primary text-on-light |
| Sky | `#B1CEF8` | Secondary gradient stop, accents |
| Pink | `#E583BA` | Gradient stop, "champion"/betting accent |
| Pink soft | `#F0B8DA` | Light gradient stop |
| Ink / text | `#1C1B2E` | Headings, primary text |
| Text muted | `#7A7893` / `#9B99B4` / `#B4B2C8` | Secondary/tertiary text |
| Success green | `#3FBF87` (deep `#2C9E6E`) | Wins, ▲ rank up, correct bets |
| Danger / live red | `#EC6A5E` (deep `#D8503F`) | LIVE state, ▼ rank down, missed bets |
| Gold (coin) | radial `#FBE6A0 → #E9B949 → #C8971F`; text `#8A6410` | Points/coin wallet |
| Surface | `#FFFFFF` | Cards |
| App background | `#FBFAFF` | Page bg (+ soft radial tints of sky & pink) |
| Border | `#EDEBF7` / `#ECEAF6` / `#F2F0FA` | Card borders, dividers |
| Track | `#EEF0FB` / `#F1EFFA` | Progress-bar tracks |

**Signature gradients:**
- Brand/hero: `linear-gradient(120deg, #7A7DE8, #898CEC 45%, #E583BA)`
- Button: `linear-gradient(135deg, #898CEC, #7A7DE8)`
- Logo ring: `conic-gradient(from 210deg, #B1CEF8, #898CEC, #E583BA, #F0B8DA, #B1CEF8)` masked to a ring
- Coin: `radial-gradient(circle at 35% 30%, #FBE6A0, #E9B949 68%, #C8971F)`

### Typography
- **Display / numerics:** `Space Grotesk` (500/600/700/800) — titles, scores, points, ranks.
- **Body / UI:** `Plus Jakarta Sans` (400–800) — everything else.
- Google Fonts import used in prototype: `Plus Jakarta Sans:400,500,600,700,800` + `Space Grotesk:500,600,700`.
- Scale (approx): page H1 24–30px/800; card H3 15–17px/700; body 13–14.5px/500–600; labels 11–12px/600–700; micro/uppercase 10–11px with `letter-spacing:.03–.06em`.

### Radius & Shadow
- Radius: cards `18–24px`; inner cards/tiles `12–17px`; pills/chips `999px`; buttons `10–14px`; avatars `10–16px`.
- Shadows: card `0 2px 12px rgba(30,27,75,.04)`; button `0 6px 16px rgba(137,140,236,.35)`; hero `0 16–18px 36–40px rgba(137,140,236,.26)`; coin inset highlight `inset 0 1px 2px rgba(255,255,255,.75)`.

### Spacing
Card padding `18–24px`; grid/flex gaps `10–16px`; section margins `18–24px`.

### Motion / keyframes
- `coinpulse` — coin scales 1→1.09→1, 2.6s ease-in-out infinite.
- `livepulse` — expanding red ring around LIVE dots, 1.8s infinite.
- `glow` — opacity .5↔.85, 1.6s, on "betting open" dots.
- `floaty` — champion trophy bobs -5px, 3.4s.
- `slideup` — modals/toasts enter (translateY 20→0, opacity 0→1, .25–.3s).
- `confpop` — confetti particles fly out & fade on bet confirm (~.95s), toggleable via a `celebrations` flag.

---

## Layout Shell (all screens)
- **Desktop (≥860px):** fixed left sidebar `250px` (glass: `rgba(255,255,255,.72)` + `backdrop-filter:blur(14px)`, right border `#ECE9F7`) with logo, nav (Dashboard / Tournaments / Leaderboard / Admin), and a season promo card pinned to the bottom. Main column has a sticky glass header and scrollable content (max-width `1180px`, centered).
- **Mobile (<860px):** sidebar hidden; a fixed bottom nav bar (Home / Play / Ranks / Admin, glass, `env(safe-area-inset-bottom)` aware) replaces it; header shows a compact logo; content padding `20px 16px 88px`. Grids collapse to single column.
- **Breakpoint is JS-driven** in the prototype (`window.innerWidth < 860`). In your stack, prefer CSS media queries / container queries.
- **Header:** left = screen title + subtitle; right = a **coin/points chip** (gold, animated) + user avatar (`AS`, indigo→pink gradient). The coin chip is **hidden on the Dashboard** and shown inside a tournament, labeled "this cup" — because **points/wallet are per-tournament, not global** (important business rule).

---

## Screens / Views

### 1. Dashboard
**Purpose:** landing; see joined tournaments and where betting is open. (Deliberately does NOT show global wallet/rank stats — those are per-tournament.)
- **Greeting:** H1 "Welcome back, Anant" + subtitle.
- **"Your tournaments"** section header with a "Browse all →" text button. Grid `repeat(auto-fill, minmax(280px,1fr))` (1 col on mobile). Each **tournament card**:
  - Icon tile `46px` rounded `14px` with a per-tournament gradient; name (700/14.5px, ellipsis) + meta ("8 players · Single elim"); a **status pill** top-right (`Live` red / `Registering` indigo / `Done` grey).
  - Progress bar (track `#EEF0FB`, fill brand gradient) + stage label ("Final", "Round 2", "Starts soon").
  - Footer divider, then a **per-tournament coin chip** (gold pill with points) + "Rank #N here" (or "Rank — here" before start).
  - Sample data: Table Tennis Championship (Live, 88%, 12 pts, #2), Carrom Cup (Live, 45%, 9 pts, #5), Chess Blitz Open (Registering, 0%, 0 pts, —).
- **Two-column row** (`minmax(0,1.55fr) minmax(0,1fr)`, stacks on mobile):
  - **Open betting windows** card — header + "N LIVE" pulsing pill. List rows: small tournament label, bold match title, note ("47 bets placed · closes at first serve"), and a **"Bet →"** button (brand gradient) that routes into the tournament's Betting tab.
  - **Latest buzz / Announcements** card — list of tagged items (Match / Betting / Results), each with colored tag chip, title, time.

### 2. Tournament detail — header + tabs
- Header block: trophy icon tile `52px`, tournament title + meta, and a right-aligned **live status pill** ("Final · Betting open", pulsing red dot).
- **Tabs (single row, horizontally scrollable):** Overview · Bracket · Betting (with a red dot indicator) · Leaderboard · Info. Active tab = brand-gradient pill; inactive = white with `#EAE7F5` border. *(These 5 replaced a previously over-tabbed nav — keep it to these 5.)*

#### 2a. Overview tab
- Two-column (`1.55fr / 1fr`, stacks mobile).
- **Left:** a **hero match card** (brand gradient) — "THE FINAL · BETTING OPEN" pill, two players (avatar tile + name + seed, "you" flagged) split by "VS", and a full-width white CTA "Place your bet — win 2 points →" (routes to Betting tab). Below it, **"Your run to the final"** card: rows per round (QF/SF/F chip + opponent + result, win rows green-tinted, upcoming row pink-tinted). "Full bracket →" link to Bracket tab.
- **Right:** **Announcements** card (same style as dashboard) + a dashed "Preview the winners reveal →" button (routes to Winners screen).

#### 2b. Bracket tab  ← recently reworked, match this exactly
- **Top-down (vertical) tree**, NOT left-to-right. Rounds stack top→bottom: Quarterfinals → Semifinals → Final.
- Container is a white card, `overflow:auto`, `max-height:74vh` — **scrolls both vertically and horizontally** to accommodate large trees. Inner wrapper `min-width:900px`, centered, `flex-direction:column; align-items:center`.
- Each round: a centered round header (name in Space Grotesk 14px + a status pill "Done"/"Live"), then a **centered flex row of match cards** (`gap:16px`, no-wrap).
- **Each match card** (`width:212px`):
  - A **status pill ABOVE the card**: `● Betting window open` (red) or `Concluded` (grey). *(Status sits above the card, not inside it.)*
  - Card shows two player rows (avatar + name + score). Winner row is brand-tinted with a stronger score color; loser row is dimmed (`opacity:.62`). Open (future) match shows "–" scores on a faint indigo background.
  - If the match's betting is open, a full-width **"Place bet →"** button (brand gradient) sits inside the card — lets a user bet directly from the tree.
- **Between rounds:** a centered connector — a short vertical line, a `30px` circle with a **down-arrow** icon, and a "WINNERS ADVANCE" micro-label — indicating flow to the next round.

#### 2c. Betting tab (HERO)
- Two-column (`1.7fr / 1fr`, stacks mobile).
- **Left — the bet builder card:** "OPEN NOW · THE FINAL" (pulsing red) + "Locks at first serve". Two large **selectable player tiles** split by "VS". Tapping a tile selects it (indigo 2px border, tinted bg, lift shadow, "✓ Your pick" pill); the other dims once a bet is locked. Below: stake/reward line ("Stake **1 point** · win **+2** · miss **−1**") and a **Lock-in button** whose label/style changes by state:
  - No pick → disabled grey "Pick a player first".
  - Pick made → brand gradient "Lock in your bet".
  - Locked → green "✓ Locked in on <player>".
- Locking opens a **confirmation modal** (see Interactions), then fires a **toast + confetti** and decrements the wallet (12 → 11).
- Below the builder: **"Your betting history"** list — each row a match label + "Backed <pick>" + a result chip (Won +2 green / Missed −1 red / Pending indigo). A freshly placed bet is prepended as Pending.
- **Right column:** a gold **Betting wallet** card (big point total + correct/missed mini-stats) and a **"How points work"** rules card.

#### 2d. Leaderboard tab
- Segmented toggle **Bettors | Players** (pill segment control on `#F4F2FE`).
- **Bettors:** header row (Rank / Bettor / Points / Acc / Move) then rows. Ranks 1–3 get gold/silver/bronze rounded badges; others show number. Columns: avatar+name (your row highlighted indigo-tinted with border and "(you)"), gold points, accuracy %, and a **rank-move cell** (`▲n` green / `▼n` red / `—` grey). Grid columns tighten on mobile.
- **Players:** ranked list of participants with avatar, name, seed, and a "reached" chip (Finalist highlighted, eliminated grey).

#### 2e. Info tab
- Two-column: left = **Tournament rules** (numbered chips) + **Betting rules** (bulleted); right = **Participants** list (avatar + name + seed). Rules content in the reference file — includes single-elim seeding, BYEs for odd counts, rounds = ceil(log₂ players), one-bet-per-match, betting locks at match start, no editing bets.

### 3. Winners reveal
**Purpose:** celebration / results.
- Centered "TOURNAMENT COMPLETE" gradient pill, title, subtitle, over a soft pink radial glow.
- **Podium:** three columns, center (1st) tallest. Champion has a bobbing gold trophy icon, gradient avatar with gold border, "CHAMPION" label; 2nd (silver bar, "Runner-up · You"), 3rd (bronze bar, "Semifinalist"). Podium bars use metallic gradients (gold `#F0C63E→#E9B949`, silver `#C7CDD6→#A9B0BC`, bronze `#CD7F32→#B0692A`).
- Below: two-column — a **"BEST BETTOR"** card (gradient, medal, name + "14 points · 75% accuracy · 6 correct calls") and a **"Your finish"** summary card with a "Back to tournament" button.

### 4. Admin console
**Purpose:** organizer management.
- Header with title + "Export CSV" (outline) and "Publish results" (gradient) buttons.
- **Lifecycle stepper** (horizontal, scrollable): Draft → Registration → Bracket → Betting → Live → Finished. Done = solid indigo with ✓; active = gradient with glow ring; todo = grey.
- Two-column body:
  - Left: **Quick actions** grid (Open/Close betting, Start match, Enter result, Announce, Schedule — each an outline button with a tinted icon chip) + **Participants** management list (avatar, name, seed/stage, "Disqualify" button, "Import CSV").
  - Right: **Betting stats** card ("47 bets placed", "47 points in play", crowd-split bars Priya 62% / Anant 38%) + a red **Developer zone** (Reset tournament / Delete / View audit logs).

---

## Interactions & Behavior
- **Navigation:** sidebar/bottom-nav switch top-level screens; tabs switch within the tournament. "Bet →" / "Place your bet" CTAs deep-link into the Betting tab. Prototype uses in-memory state; wire to your router.
- **Bet flow:** select tile → enable Lock button → click → **confirmation modal** ("Lock your bet?", shows pick, cost 1, reward +2, Cancel / "Lock it in") → on confirm: close modal, mark bet placed, decrement wallet, prepend Pending history row, show **success toast** ("Locked in on <player> — win 2 points if they take it!") auto-dismissing after 4s, plus a **confetti burst** (skippable when celebrations are disabled). Bets are one-per-match and immutable once locked.
- **Responsive:** layout swaps at 860px (sidebar↔bottom-nav, multi-col↔single-col, header coin visibility). Bracket & tab strips scroll horizontally on small screens.
- **Hover/active:** cards lift (`translateY(-2px)`) and brighten borders; buttons lift slightly.

## State Management
Prototype state (translate to your store/hooks):
- `screen` (dashboard | tournament | winners | admin), `tab` (overview | bracket | betting | leaderboard | info), `lb` (bettors | players).
- `betPick` (selected player | null), `betPlaced` (bool), `betModal` (bool), `toast` (string | null), `burst` (bool).
- `isMobile` (from resize listener).
- Derived: wallet `points` = 12, becomes 11 after placing the Final bet (per-tournament balance).

## Data / backend requirements
Replace all mock data with real endpoints:
- Tournaments (id, name, sport/meta, format, status, per-user progress %, stage, **per-tournament wallet + rank**), participants/seeds, bracket (rounds → matches → players, scores, winner, status: concluded/open/upcoming, betting-open flag), bets (per user/match, pick, stake, result), leaderboards (bettors: points/accuracy/rank-move; players: reached stage), announcements, admin actions & lifecycle state, betting aggregates (counts, crowd split).
- Enforce server-side: one bet per match, lock at match start, no edits, points math (+2 win / −1 loss, entry grant = rounds + 5).

## Assets
No raster images or external icon libraries. Everything is **inline SVG** (nav/action/trophy/arrow icons) and CSS gradients (logo ring, coins, avatars use initials). Fonts: Google Fonts **Plus Jakarta Sans** + **Space Grotesk** — self-host or import in your app. Reuse your codebase's icon set if it has one; otherwise the inline SVG paths are in the reference file.

## Files
- `reference/Tournament Platform.dc.html` — authoritative source for exact markup, inline styles, and logic (`renderVals()`). Read for precise values; do not run/import.
- `reference/LUMIQ Arena (standalone preview).html` — open in a browser to view & click the live design.

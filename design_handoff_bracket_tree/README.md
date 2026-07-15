# Handoff: Tournament Bracket Tree component

Recreate the **bracket tree** from the LUMIQ Arena prototype as a component in the target codebase. The reference file (`Tournament Platform.dc.html`, "Bracket" tab) shows the intended look/behavior — it runs on a custom preview runtime, so **read it for exact values; do not import it**. Build in the app's own stack (React/TS recommended) and wire to the real backend.

## What it is
A **top-down single-elimination tree**: rounds stack vertically (Round 1 at top → Final at bottom). Each match is a small square box; SVG connector lines flow from each pair of matches down into the match they feed. Mobile-first (vertical scroll priority); scrolls horizontally only when a round is too wide.

## Component API (suggested)
```
<BracketTree
  rounds={Round[]}          // ordered top→bottom
  role="player" | "admin"
  onPlaceBet={(matchId, playerId) => ...}
  onAdminAction={(matchId, action) => ...}  // 'openBetting'|'closeBetting'|'goLive'|'conclude'|'reopen'
/>

Round  = { id, name, matches: Match[] }
Match  = { id, roundIndex, p1: Player, p2: Player, s1?: number, s2?: number,
           winner?: 'p1'|'p2'|null, state: MatchState, userBet?: {pick,'result':'won'|'lost'|'pending'} }
Player = { id, name, initials, color }
MatchState = 'scheduled' | 'open' | 'live' | 'concluded'
```

## Layout & geometry (the important part)
Do NOT use `position:absolute` for boxes — build with normal flow so it stays capturable/exportable and reflows responsively:

- Outer: a horizontally+vertically scrollable container. Inner column has a fixed width `treeW = firstRoundMatchCount * SLOT`.
- Per round, top→bottom: **round-name chip (centered)** → **row of matches** → **connector band** (skip band after the last round).
- **Row:** `display:flex`, full `treeW`. Each match sits in an equal **slot** of width `treeW / matchCountInThisRound`, box centered in it. Because every round shares `treeW` and centers boxes in equal slots, a match's center is at `(index + 0.5) * treeW / count` — so a pair `2j, 2j+1` in one round is centered exactly over child `j` in the next. This is what makes connectors line up.
- **Connector band:** an inline `<svg width={treeW} height={GAP}>` (normal flow, `display:block`). For each child `j` (count = next round's count): `childX = (j+0.5)*treeW/childCount`; parents at `parentX = (2j+0.5 | 2j+1.5)*treeW/parentCount`. Draw per parent: `M parentX 0 V GAP/2 H childX V GAP`. Stroke `#DBD5F0`; use a pink `#E3A9C6` when the child match is `open`/`live` to draw the eye.
- Sizes (prototype): desktop `SLOT 136, box 100×100, GAP 56`; mobile (<860px) `SLOT 88, box 76×76, GAP 44`. Box radius 15.
- Scalability: more matches in round 1 → larger `treeW` → horizontal scroll kicks in; vertical is always the primary axis.

## The match box (minimal until interacted)
Square, white, 1.5px border. Contents, centered: a tiny **state tag** at top (colored dot + 8px uppercase label), then `p1 first name / "vs" / p2 first name`. First names only. On concluded matches, **winner name bold `#1C1B2E`, loser muted `#B7B5CA`**; otherwise both `#43415C`. No scores in the box — details live in the expand. Selected box: indigo border `#898CEC` + lift shadow.

### State styles
| State | dot | label | border | note |
|---|---|---|---|---|
| open (betting) | `#EC6A5E` | Betting | `rgba(236,106,94,.42)` | dot pulses |
| live | `#E9A23B` | Live | `rgba(233,162,59,.5)` | dot pulses |
| scheduled | `#C9C3EE` | Soon | `#E1DCF0` | dashed border |
| concluded | `#B4B2C8` | Done | `#ECEAF6` | — |

Include a small legend above the tree (dot + label for each state) and a **Player / Admin** segmented toggle.

## Interaction — click a box to expand
Clicking any box opens a **detail panel**: bottom-sheet on mobile (slides up, rounded top, drag handle), centered modal on desktop (~440px). Dim backdrop; click backdrop or ✕ to close. Panel shows: round name + state pill, both players (avatar initials + full name + score if concluded/live, winner highlighted), then role-specific actions:

- **Player + open match:** two player pick buttons → selecting enables a "Lock in your bet" button (stake 1, win +2). Locking → confirmation modal → success toast (+ optional confetti) → wallet decrements; the bet becomes a "pending" history row. One bet per match, immutable.
- **Player + non-open:** result chip (Won +2 / Missed −1 / No bet) + note.
- **Admin (any state):** organizer buttons that change the match state and update its indicator live — `scheduled`→[Open betting, Start match]; `open`→[Close betting, Go live]; `live`→[Conclude match, Reopen betting]; `concluded`→[Edit result, Reopen match].

## Tokens
Primary `#898CEC` / `#7A7DE8`; ink `#1C1B2E`; muted `#7A7893`/`#9B99B4`; success `#3FBF87`; danger `#EC6A5E`; surface `#fff`; borders `#EDEBF7`/`#ECEAF6`. Fonts: **Space Grotesk** (scores/labels) + **Plus Jakarta Sans** (everything). Button gradient `linear-gradient(135deg,#898CEC,#7A7DE8)`. Keyframe for pulsing dots: expanding red/amber ring, ~1.8s infinite.

## Backend
Match state, scores, winner, betting-open flag, per-user bet + result, participants/seeds. Enforce server-side: one bet per match, betting locks at match start, no edits, points math (+2 win / −1 loss).

## Files
- `reference/Tournament Platform.dc.html` — open in a browser, go to a tournament → **Bracket** tab. Read the `renderVals()` `treeRounds`/`boxOf`/connector code and the expand-sheet block for exact styles.

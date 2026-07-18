Design this as if it will be deployed inside a company with around 500 employees. Produce the complete system architecture, Prisma schema, RBAC model, database design, UI page hierarchy, component hierarchy, state management strategy, and folder structure before writing any implementation code for a generalized tournament hosting webapp where users can support their pick also, and after the tournament ends, the 3 winners are shown alongside the best supporter of the tournament

**Updated 2026-07:** every user-facing and internal use of "bet"/"betting"/"bettor" has been renamed to "support"/"supporter" for corporate-friendly terminology — same mechanics throughout (stake points on a predicted winner, earn double back if correct), just a different word. The `Bet` Prisma model is now `Support`, `MatchStatus.BETTING_OPEN` is now `SUPPORT_OPEN`, `Tournament.bettingOpen`/`bettingClose` are now `supportOpen`/`supportClose`, and `Tournament.bestBettorId` is now `bestSupporterId`. The sections below use the updated terminology throughout.

the webapp should be responsive and should work on PCs as well as mobile phones

##### login and authentication
**Updated 2026-07:** switched away from Microsoft OAuth + company-domain restriction (the original plan below) after the Microsoft 365 admin-consent/IT-review process turned out to be more overhead than the project needed right now. Auth is now Clerk with email + password:
- Sign up with: email, password, full name (first + last, both required — enforced in Clerk Dashboard's "First and last name" setting).
- Sign in with: email, password.
- Email must be confirmed via a verification code sent to the user's inbox before the account is usable (enforced in Clerk Dashboard's email verification setting).
- No company-domain restriction — any email address can sign up. There is no `isAllowedEmail`/`ALLOWED_EMAIL_DOMAIN` check anymore.
- First login automatically creates the `User` row (via the Clerk `user.created` webhook, with a JIT-create fallback in `getCurrentUser()`); subsequent logins reuse the same account.
- User email is immutable once set.
- Login sessions are handled by Clerk; middleware (`middleware.ts`) wraps every route with Clerk's auth context, and actual per-route/per-action authorization happens in `lib/auth.ts` (`requireUser`/`requireRole`/`requireRoleForAction`), not in middleware path-matching.

<details>
<summary>Original plan (superseded — kept for history)</summary>

login should be secure and no person should be able to login twice, this webapp is going to be made for a company thus every employee has a company email id in the form of name.surname@companyname.ai thus we need to decide on how to stop a person from making two accounts, maybe auth using company's email, every person has 1 only, but yeah enlighten me on it.
Use Clerk Authentication with Google OAuth restricted to the company's email domain (example -> anant.sinha@lumiq.ai)
Requirements:
- Only company email addresses may sign in.
- No manual signup.
- No username/password authentication.
- First login automatically creates the user.
- Subsequent logins reuse the same account.
- One Clerk account per company email.
- User email is immutable.
- Users cannot change their email.
- Login sessions should be secure.
- Middleware protects all private routes.
</details>

##### Database
there should be a database on neon, thus design a database also where there will be the user's database, tournament's details and stuff
```
Users

id
clerkId
email
name
role
department
createdAt

------------------

Tournaments

id
title
description
status
registrationOpen
registrationClose
supportOpen
supportClose
createdBy

------------------

Participants

id
userId
tournamentId
seed
eliminated
currentRound

------------------

Matches

id
tournamentId
round
matchNumber
player1
player2
winner
status
scheduledTime

------------------

Support

id
userId
matchId
predictedWinner
lockedAt
won
pointsSpent
pointsEarned

------------------

TournamentWallet

id
userId
tournamentId
currentPoints

------------------

Announcements

id
tournamentId
title
content
createdBy

------------------

AuditLogs

id
actor
action
time
details
```

##### Users types
there should also be three types of users, normal users, admins and developers with their set of priviliges
- Developer - Full access - Create/Delete admins - Delete tournaments - View logs - Database management - Reset tournaments - Override matches - Manage feature flags
- Admin - Create tournament - Edit tournament - Delete tournament - Manage participants - Start/Stop registrations - Open/Close support - Generate bracket - Schedule matches - Enter results - Disqualify participants - Publish announcements 
- User - Join tournament - Leave before registration closes - Give support - View leaderboard - View bracket - View match schedule

##### admin console
Admin should be able to
```
Create tournament
Edit tournament
Delete tournament
Import participants
Remove participant
Generate bracket
Schedule matches
Open support
Close support
Start match
End match
Declare winner
View support statistics
Export tournament results
Download CSV
```


##### matches and tournament rules
the matches will be held in a tournament tree style, after the participants get locked in and the window closes
a tournament tree is made randomly (handle odd number of participants too)

##### tournament lifecycle
Draft -> Registration Open -> Registration Closed -> Bracket Generated -> Support Open  -> Match Live -> Match Finished -> Next Match -> Repeat from support until all matches done -> Tournament Finished -> Archived

##### Tournament Dashboard
```
Overview
Bracket
Participants
Upcoming Matches
Support
Leaderboard
Support Leaderboard
Announcements
Rules
```

##### bracket generation
Random seeding, Shuffle participants, Handle odd number of players using BYEs, A player receiving a BYE automatically advances, Number of rounds should automatically be calculated.

##### support rules
- only one show of support per match
- cannot support both players
- cannot edit after submission
- support automatically locks when the match starts
- support history should remain visible

##### support maths
support rule is that a user gets N support points upon entering a tournament (N is the number of matches from beginning to the end +5) everytime they lock in their support, they are putting in 1 support point, if the user's supported player wins they win back 2 points, else lose that 1 point

Rounds = ceil(log2(players)) 
Initial Support Points N = rounds + 5 
Each show of support costs 1 point. 
Correct prediction: +2 points 
Wrong prediction: -1 point

##### leaderboard
there should also be a leaderboard panel in every tournament's page
Support Leaderboard
```
Rank
User
Support Points
Correct Support
Incorrect Support
Accuracy %
```

##### colour and design scheme
**Updated 2026-07:** rebalanced to lead with the company logo's orange, rather than the original all-purple/pink/blue palette below.
Background #FFFFFF
Primary #F0934D (orange)
Secondary #B1CEF8 (blue)
Accent #898CEC (purple, was Primary)
Pink #E583BA kept as a supporting/chart color, no longer one of the three named roles
Rounded cards
Modern dashboard
Minimal Glassmorphism only where appropriate 
Responsive Desktop-first

##### Tech Stack
```
# Frontend
Next.js 15
React
TypeScript
TailwindCSS
shadcn/ui

# Backend
Next.js Server Actions
tRPC (optional)

# Authentication
Clerk

# Database
Neon PostgreSQL

# ORM
Prisma

# Validation
Zod
```

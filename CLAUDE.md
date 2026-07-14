Design this as if it will be deployed inside a company with around 500 employees. Produce the complete system architecture, Prisma schema, RBAC model, database design, UI page hierarchy, component hierarchy, state management strategy, and folder structure before writing any implementation code for a generalized tournament hosting webapp where users can bet also, and after the tournament ends, the 3 winners are shown alongside the best better of the tournament

the webapp should be responsive and should work on PCs as well as mobile phones

##### login and authentication
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
bettingOpen
bettingClose
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

Bets

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
- Admin - Create tournament - Edit tournament - Delete tournament - Manage participants - Start/Stop registrations - Open/Close betting - Generate bracket - Schedule matches - Enter results - Disqualify participants - Publish announcements 
- User - Join tournament - Leave before registration closes - Place bets - View leaderboard - View bracket - View match schedule

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
Open betting
Close betting
Start match
End match
Declare winner
View betting statistics
Export tournament results
Download CSV
```


##### matches and tournament rules
the matches will be held in a tournament tree style, after the participants get locked in and the window closes
a tournament tree is made randomly (handle odd number of participants too)

##### tournament lifecycle
Draft -> Registration Open -> Registration Closed -> Bracket Generated -> Betting Open  -> Match Live -> Match Finished -> Next Match -> Repeat from betting until all matches done -> Tournament Finished -> Archived

##### Tournament Dashboard
```
Overview
Bracket
Participants
Upcoming Matches
Betting
Leaderboard
Betting Leaderboard
Announcements
Rules
```

##### bracket generation
Random seeding, Shuffle participants, Handle odd number of players using BYEs, A player receiving a BYE automatically advances, Number of rounds should automatically be calculated.

##### betting rules
- only one bet per match
- cannot bet on both players
- cannot edit after submission
- betting automatically locks when the match starts
- betting history should remain visible

##### betting maths
betting rule is that a user gets N betting points upon entering a tournament (N is the number of matches from beginning to the end +5) everytime they lock in their bet, they are putting in 1 betting point, if the user's bet wins they win back 2 points, else lose that 1 point

Rounds = ceil(log2(players)) 
Initial Betting Points N = rounds + 5 
Each bet costs 1 point. 
Correct prediction: +2 points 
Wrong prediction: -1 point

##### leaderboard
there should also be a leaderboard panel in every tournament's page
Betting Leaderboard
```
Rank
User
Betting Points
Correct Bets
Incorrect Bets
Accuracy %
```

##### colour and design scheme 
Background #FFFFFF 
Primary #898CEC 
Secondary #B1CEF8
Accent #E583BA 
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

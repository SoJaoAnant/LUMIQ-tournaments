# LUMIQ League

Internal tournament hosting & support platform. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design (schema, RBAC, page/component hierarchy, state management, bracket/support algorithms) and [CLAUDE.md](CLAUDE.md) for the original product spec.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Neon Postgres

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string into `DATABASE_URL` and the **direct** (unpooled) one into `DIRECT_URL` in `.env.local` (copy `.env.example` to start).
3. Run migrations:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

### 3. Clerk (authentication)

Auth is email + password, with email verification at sign-up — no company-domain restriction, any email can sign up.

1. Create an app at [clerk.com](https://clerk.com).
2. In **User & Authentication → Email, Phone, Username**: enable **Email address**, and set it to require verification at sign-up (email code or link).
3. In **User & Authentication → Password**: enable **Password** as a strategy.
4. Still in **User & Authentication**: enable **"First and last name"** and check **"Require first and last name"**, so sign-up collects a full name.
5. If Microsoft (or any other social connection) is still enabled from an earlier setup, disable it under **SSO Connections** — this project doesn't use it.
6. Copy the publishable/secret keys into `.env.local`.
7. Under **Webhooks**, add an endpoint pointing at `https://<your-domain>/api/webhooks/clerk` subscribed to `user.created`, `user.updated`, `user.deleted`. Copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.

Until you set real Clerk keys, the app runs in Clerk's **keyless mode** — a temporary, fully-functional dev instance is auto-provisioned so you can exercise the sign-in/sign-up flow immediately.

### 4. Bootstrapping the first Developer account

There's no admin yet to promote the first one, so:
1. Sign up once (creates your `User` row via the Clerk webhook/JIT sync).
2. Run `npm run db:studio`, open the `User` table, and set your row's `role` to `DEVELOPER`.
3. From then on, use **Developer Console → Manage Admins** in the app to promote/demote everyone else.

### 5. Run it

```bash
npm run dev
```

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run db:migrate` — apply Prisma migrations
- `npm run db:seed` — seed baseline feature flags
- `npm run db:studio` — Prisma Studio (also doubles as the "database management" tool for Developers)

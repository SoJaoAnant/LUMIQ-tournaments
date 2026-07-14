# LUMIQ Tournaments

Internal tournament hosting & betting platform. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design (schema, RBAC, page/component hierarchy, state management, bracket/betting algorithms) and [CLAUDE.md](CLAUDE.md) for the original product spec.

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

The company's email is hosted on **Microsoft 365**, so sign-in uses Microsoft (Entra ID) OAuth rather than Google — an employee's Microsoft work account already proves they own their `@lumiq.ai` mailbox, the same way Google OAuth would for a Google Workspace company.

1. Create an app at [clerk.com](https://clerk.com).
2. In **User & Authentication**: disable Email/Password and Email code sign-in, enable **Microsoft** as the only strategy.
3. (Optional, for production) Clerk's shared dev-mode Microsoft connection lets *any* Microsoft account sign in, not just your tenant's. For a real rollout, register your own app in Azure AD / Entra ID scoped to **"Accounts in this organizational directory only (Single tenant)"**, then plug those credentials into Clerk's Microsoft connection — this restricts login to your company's tenant at the Microsoft level too.
4. Copy the publishable/secret keys into `.env.local`.
5. Under **Webhooks**, add an endpoint pointing at `https://<your-domain>/api/webhooks/clerk` subscribed to `user.created`, `user.updated`, `user.deleted`. Copy the signing secret into `CLERK_WEBHOOK_SIGNING_SECRET`.
6. Set `ALLOWED_EMAIL_DOMAIN` in `.env.local` to match — **this is the check that actually matters today**: regardless of tenant restrictions on Microsoft's side, the app itself rejects any sign-in whose email doesn't end in `@ALLOWED_EMAIL_DOMAIN` (see `lib/rbac.ts#isAllowedEmail`, used by both the webhook and the JIT-sync fallback in `lib/auth.ts`).

Until you set real Clerk keys, the app runs in Clerk's **keyless mode** — a temporary, fully-functional dev instance is auto-provisioned so you can exercise the sign-in flow immediately (just not restricted to your domain yet).

### 4. Bootstrapping the first Developer account

There's no admin yet to promote the first one, so:
1. Sign in once with your company email (creates your `User` row via the Clerk webhook/JIT sync).
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

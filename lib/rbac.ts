import type { Role } from "@prisma/client"

const ROLE_RANK: Record<Role, number> = {
  USER: 0,
  ADMIN: 1,
  DEVELOPER: 2,
}

export function hasAtLeastRole(role: Role, minRole: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[minRole]
}

/**
 * Reference matrix of capabilities per role, per CLAUDE.md. Used for nav/UI
 * gating; the actual enforcement boundary is `requireRole`/`requireRoleForAction`
 * in lib/auth.ts, called inside every Server Action.
 */
export const PERMISSIONS = {
  USER: [
    "tournament:join",
    "tournament:leave",
    "bet:place",
    "leaderboard:view",
    "bracket:view",
    "matches:view",
  ],
  ADMIN: [
    "tournament:create",
    "tournament:edit",
    "tournament:delete",
    "participants:manage",
    "registration:toggle",
    "betting:toggle",
    "bracket:generate",
    "matches:schedule",
    "matches:enterResult",
    "participants:disqualify",
    "announcements:publish",
  ],
  DEVELOPER: [
    "admins:manage",
    "logs:view",
    "database:manage",
    "tournaments:reset",
    "matches:override",
    "featureFlags:manage",
  ],
} as const

export function isAllowedEmail(email: string | null | undefined) {
  if (!email) return false
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN
  if (!allowedDomain) return true
  return email.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)
}

import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { Role, User } from "@prisma/client"

import { db } from "@/lib/db"
import { hasAtLeastRole } from "@/lib/rbac"

/**
 * Resolves the current DB user for this request. The Clerk webhook is the
 * primary way `User` rows get created, but on a brand-new sign-in the
 * webhook may not have landed yet — this JIT-creates the row as a fallback
 * so there's no race between "logged in" and "has a User row".
 */
export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth()
  if (!userId) return null

  const existing = await db.user.findUnique({ where: { clerkId: userId } })
  if (existing) return existing

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId
  )?.emailAddress

  if (!email) return null

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
    email.split("@")[0]

  try {
    return await db.user.create({
      data: { clerkId: userId, email, name },
    })
  } catch {
    // Lost a create race against the webhook — it already inserted the row.
    return db.user.findUnique({ where: { clerkId: userId } })
  }
}

/**
 * For Server Components/pages: redirects unauthenticated visitors to sign-in,
 * and Clerk-authenticated-but-unrecognized visitors to /unauthorized instead
 * of bouncing them back into a sign-in loop.
 *
 * `redirectTo`, when given, is threaded through as `?redirect_url=` so Clerk's
 * hosted sign-in/sign-up sends the visitor back to that page (e.g. a shared
 * tournament link) once they've authenticated, instead of the default
 * dashboard fallback.
 */
export async function requireUser(redirectTo?: string): Promise<User> {
  const { userId } = await auth()
  if (!userId) {
    redirect(redirectTo ? `/sign-in?redirect_url=${encodeURIComponent(redirectTo)}` : "/sign-in")
  }

  const user = await getCurrentUser()
  if (!user) redirect("/unauthorized")
  return user
}

/** For Server Components/pages: redirects to /unauthorized if role is insufficient. */
export async function requireRole(minRole: Role, redirectTo?: string): Promise<User> {
  const user = await requireUser(redirectTo)
  if (!hasAtLeastRole(user.role, minRole)) redirect("/unauthorized")
  return user
}

export class ForbiddenError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message)
    this.name = "ForbiddenError"
  }
}

/**
 * For Server Actions: throws instead of redirecting, so callers can catch
 * and surface a toast/error instead of navigating away mid-mutation.
 */
export async function requireRoleForAction(minRole: Role): Promise<User> {
  const user = await getCurrentUser()
  if (!user) throw new ForbiddenError("You must be signed in to do that.")
  if (!hasAtLeastRole(user.role, minRole)) throw new ForbiddenError()
  return user
}

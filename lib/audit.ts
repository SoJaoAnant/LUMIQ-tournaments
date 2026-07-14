import "server-only"

import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

/** Records an admin/developer mutation. Never throws — auditing must not break the action it's logging. */
export async function logAudit(
  actorId: string,
  action: string,
  details?: Record<string, unknown>
) {
  try {
    await db.auditLog.create({
      data: {
        actorId,
        action,
        details: details as Prisma.InputJsonValue | undefined,
      },
    })
  } catch (err) {
    console.error("Failed to write audit log", action, err)
  }
}

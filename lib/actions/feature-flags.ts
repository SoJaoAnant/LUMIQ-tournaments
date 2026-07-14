"use server"

import { revalidatePath } from "next/cache"

import { requireRoleForAction } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"

export async function setFeatureFlag(key: string, enabled: boolean) {
  const dev = await requireRoleForAction("DEVELOPER")

  await db.featureFlag.upsert({
    where: { key },
    update: { enabled },
    create: { key, enabled },
  })

  await logAudit(dev.id, "featureFlag.set", { key, enabled })
  revalidatePath("/developer/feature-flags")
}

export async function createFeatureFlag(key: string, description: string) {
  const dev = await requireRoleForAction("DEVELOPER")
  const cleanKey = key.trim().toLowerCase().replace(/\s+/g, "_")
  if (!cleanKey) throw new Error("Key is required")

  await db.featureFlag.create({
    data: { key: cleanKey, description: description || null, enabled: false },
  })

  await logAudit(dev.id, "featureFlag.create", { key: cleanKey })
  revalidatePath("/developer/feature-flags")
}

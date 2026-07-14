"use server"

import { requireRoleForAction } from "@/lib/auth"
import { logAudit } from "@/lib/audit"
import { db } from "@/lib/db"
import { announcementFormSchema, type AnnouncementFormValues } from "@/lib/validations/announcement"
import { revalidateTournamentPaths } from "@/lib/revalidate"

export async function publishAnnouncement(tournamentId: string, values: AnnouncementFormValues) {
  const admin = await requireRoleForAction("ADMIN")
  const data = announcementFormSchema.parse(values)

  const announcement = await db.announcement.create({
    data: {
      tournamentId,
      title: data.title,
      content: data.content,
      createdById: admin.id,
    },
  })

  await logAudit(admin.id, "announcement.publish", { tournamentId, announcementId: announcement.id })
  revalidateTournamentPaths(tournamentId)
  return announcement
}

export async function deleteAnnouncement(tournamentId: string, announcementId: string) {
  const admin = await requireRoleForAction("ADMIN")

  await db.announcement.delete({ where: { id: announcementId } })

  await logAudit(admin.id, "announcement.delete", { tournamentId, announcementId })
  revalidateTournamentPaths(tournamentId)
}

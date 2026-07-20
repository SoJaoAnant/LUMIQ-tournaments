"use server"

import { getCurrentUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { getRecentNotifications } from "@/lib/data/notifications"

/** Powers the notification bell's poll/refresh — scoped to whoever is actually signed in, never a client-supplied id. */
export async function fetchMyNotifications() {
  const user = await getCurrentUser()
  if (!user) return { notifications: [], unreadCount: 0 }
  return getRecentNotifications(user.id)
}

export async function markNotificationRead(notificationId: string) {
  const user = await getCurrentUser()
  if (!user) return

  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id },
    data: { read: true },
  })
}

export async function markAllNotificationsRead() {
  const user = await getCurrentUser()
  if (!user) return

  await db.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })
}

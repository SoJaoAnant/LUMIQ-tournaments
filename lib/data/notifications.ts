import { cache } from "react"

import { db } from "@/lib/db"

export const getRecentNotifications = cache(async (userId: string) => {
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({ where: { userId, read: false } }),
  ])
  return { notifications, unreadCount }
})

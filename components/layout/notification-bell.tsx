"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Bell } from "lucide-react"
import type { Notification } from "@prisma/client"

import {
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notifications"
import { timeAgo } from "@/lib/format"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const POLL_INTERVAL_MS = 30_000

export function NotificationBell({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: Notification[]
  initialUnreadCount: number
}) {
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [, startTransition] = useTransition()

  useEffect(() => {
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  async function refresh() {
    try {
      const data = await fetchMyNotifications()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      // Transient polling failure — next tick will retry.
    }
  }

  function handleSelect(n: Notification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
      startTransition(async () => {
        await markNotificationRead(n.id)
      })
    }
    if (n.link) router.push(n.link)
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
    startTransition(async () => {
      await markAllNotificationsRead()
    })
  }

  return (
    <DropdownMenu onOpenChange={(nextOpen) => nextOpen && refresh()}>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label="Notifications" className="relative" />}
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[90vw] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-bold">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            notifications.map((n) => (
              <DropdownMenuItem
                key={n.id}
                onClick={() => handleSelect(n)}
                className={cn(
                  "flex-col items-start gap-0.5 rounded-none border-b border-border px-3 py-2.5 last:border-b-0",
                  !n.read && "bg-primary/5"
                )}
              >
                <div className="flex w-full items-center gap-1.5">
                  {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                  <p className="truncate text-sm font-semibold">{n.title}</p>
                </div>
                <p className="line-clamp-2 w-full text-xs text-muted-foreground">{n.body}</p>
                <p className="text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

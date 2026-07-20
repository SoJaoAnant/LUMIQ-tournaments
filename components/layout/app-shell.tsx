import type { Notification, Role } from "@prisma/client"

import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"

export function AppShell({
  role,
  name,
  notifications = [],
  unreadCount = 0,
  children,
}: {
  role: Role
  name: string
  notifications?: Notification[]
  unreadCount?: number
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-1">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar role={role} name={name} notifications={notifications} unreadCount={unreadCount} />
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

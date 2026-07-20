import { requireRole } from "@/lib/auth"
import { AppShell } from "@/components/layout/app-shell"
import { getRecentNotifications } from "@/lib/data/notifications"

export default async function DeveloperGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole("DEVELOPER")
  const { notifications, unreadCount } = await getRecentNotifications(user.id)

  return (
    <AppShell role={user.role} name={user.name} notifications={notifications} unreadCount={unreadCount}>
      {children}
    </AppShell>
  )
}

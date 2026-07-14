import { requireRole } from "@/lib/auth"
import { AppShell } from "@/components/layout/app-shell"

export default async function DeveloperGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireRole("DEVELOPER")

  return (
    <AppShell role={user.role} name={user.name}>
      {children}
    </AppShell>
  )
}

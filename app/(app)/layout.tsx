import { requireUser } from "@/lib/auth"
import { AppShell } from "@/components/layout/app-shell"

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  return (
    <AppShell role={user.role} name={user.name}>
      {children}
    </AppShell>
  )
}

import { ShieldCheck } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RoleSelect } from "@/components/developer/role-select"
import { PromoteUserForm } from "@/components/developer/promote-user-form"

export default async function DeveloperAdminsPage() {
  const dev = await requireRole("DEVELOPER")

  const admins = await db.user.findMany({
    where: { role: { in: ["ADMIN", "DEVELOPER"] } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ShieldCheck className="size-6 text-primary" />
          Manage Admins
        </h1>
        <p className="text-sm text-muted-foreground">
          Promote an existing account to Admin, or change anyone&apos;s role below.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Promote a User</CardTitle>
        </CardHeader>
        <CardContent>
          <PromoteUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Admins &amp; Developers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <RoleSelect userId={u.id} role={u.role} disabled={u.id === dev.id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

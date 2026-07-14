import { ScrollText } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { EmptyState } from "@/components/shared/empty-state"

export default async function DeveloperAuditLogsPage() {
  await requireRole("DEVELOPER")

  const logs = await db.auditLog.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { time: "desc" },
    take: 200,
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ScrollText className="size-6 text-primary" />
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">Last 200 admin/developer actions.</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit log entries yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {log.time.toLocaleString()}
                </TableCell>
                <TableCell className="font-medium">{log.actor.name}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell className="max-w-xs truncate font-mono text-xs text-muted-foreground">
                  {log.details ? JSON.stringify(log.details) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

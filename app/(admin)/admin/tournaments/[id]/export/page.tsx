import { notFound } from "next/navigation"
import { Download } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function AdminExportPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole("ADMIN")
  const { id } = await params

  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) notFound()

  const participants = await db.participant.findMany({
    where: { tournamentId: id },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { seed: "asc" },
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Export Results</h2>
          <p className="text-sm text-muted-foreground">
            Download a CSV of every participant with their final placement.
          </p>
        </div>
        <Button render={<a href={`/api/tournaments/${id}/export`} />} nativeButton={false}>
          <Download className="size-4" />
          Download CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seed</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participants.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.seed || "—"}</TableCell>
                  <TableCell>{p.user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.user.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

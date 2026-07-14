import Papa from "papaparse"
import { NextResponse } from "next/server"

import { getCurrentUser } from "@/lib/auth"
import { hasAtLeastRole } from "@/lib/rbac"
import { db } from "@/lib/db"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user || !hasAtLeastRole(user.role, "ADMIN")) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const { id } = await params
  const tournament = await db.tournament.findUnique({ where: { id } })
  if (!tournament) return new NextResponse("Not found", { status: 404 })

  const participants = await db.participant.findMany({
    where: { tournamentId: id },
    include: { user: { select: { name: true, email: true, department: true } } },
    orderBy: { seed: "asc" },
  })

  const rows = participants.map((p) => {
    let placement = `Round ${p.currentRound}`
    if (p.id === tournament.winnerParticipantId) placement = "1st Place"
    else if (p.id === tournament.runnerUpParticipantId) placement = "2nd Place"
    else if (p.id === tournament.thirdPlaceParticipantId) placement = "3rd Place"
    else if (p.eliminated) placement = `Eliminated (Round ${p.currentRound})`

    return {
      Seed: p.seed,
      Name: p.user.name,
      Email: p.user.email,
      Department: p.user.department ?? "",
      Placement: placement,
    }
  })

  const csv = Papa.unparse(rows)
  const filename = `${tournament.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-results.csv`

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}

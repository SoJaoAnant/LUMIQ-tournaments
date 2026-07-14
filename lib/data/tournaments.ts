import { cache } from "react"

import { db } from "@/lib/db"

/** React-request-deduped so layout + page can both call this without double-querying. */
export const getTournament = cache(async (tournamentId: string) => {
  return db.tournament.findUnique({ where: { id: tournamentId } })
})

export const getMyParticipation = cache(async (tournamentId: string, userId: string) => {
  return db.participant.findUnique({
    where: { userId_tournamentId: { userId, tournamentId } },
  })
})

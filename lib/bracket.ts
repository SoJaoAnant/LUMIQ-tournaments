import { randomUUID } from "crypto"

export type BracketMatch = {
  id: string
  round: number
  matchNumber: number
  player1Id: string | null
  player2Id: string | null
  winnerId: string | null
  status: "SCHEDULED" | "FINISHED"
  isBye: boolean
  isThirdPlaceMatch: boolean
  nextMatchId: string | null
  nextMatchSlot: number | null
  loserToMatchId: string | null
  loserToSlot: number | null
}

export function computeRounds(participantCount: number) {
  return Math.ceil(Math.log2(participantCount))
}

export function getRoundLabel(round: number, totalRounds: number) {
  const fromFinal = totalRounds - round
  if (fromFinal === 0) return "Final"
  if (fromFinal === 1) return "Semifinal"
  if (fromFinal === 2) return "Quarterfinal"
  return `Round ${round}`
}

export function getRoundAbbrev(round: number, totalRounds: number) {
  const fromFinal = totalRounds - round
  if (fromFinal === 0) return "F"
  if (fromFinal === 1) return "SF"
  if (fromFinal === 2) return "QF"
  return `R${round}`
}

export function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Builds a full single-elimination bracket (all rounds' match shells, wired
 * for auto-advancement) from a shuffled list of participant IDs. Handles
 * odd/non-power-of-two counts via randomly distributed byes, and adds a
 * bronze (3rd place) match fed by the two semifinal losers when a semifinal
 * round exists.
 *
 * Pure function — no DB access — so the bracket shape can be reasoned about
 * and tested independently of Prisma.
 */
export function generateBracketMatches(participantIds: string[]): {
  rounds: number
  matches: BracketMatch[]
  /** Random seed number (1-indexed) assigned to each participant, for display purposes. */
  seeds: Record<string, number>
} {
  const n = participantIds.length
  if (n < 2) throw new Error("Need at least 2 participants to generate a bracket")

  const rounds = computeRounds(n)
  const bracketSize = 2 ** rounds
  const pairCount = bracketSize / 2
  // bracketSize is the smallest power of 2 >= n, so byeCount is always < pairCount —
  // there's always room to give every bye its own pair (never two byes sharing a match).
  const byeCount = bracketSize - n

  const shuffledParticipants = fisherYatesShuffle(participantIds)
  const seeds: Record<string, number> = {}
  shuffledParticipants.forEach((id, i) => {
    seeds[id] = i + 1
  })
  const byePairIndices = new Set(
    fisherYatesShuffle(Array.from({ length: pairCount }, (_, i) => i)).slice(0, byeCount)
  )

  const matches: BracketMatch[] = []
  // matchIdsByRound[r][i] = id of the i-th match (0-indexed) in round r (1-indexed rounds)
  const matchIdsByRound: string[][] = []

  // Round 1: pair up participants one bye-pair at a time, resolving byes immediately.
  const round1Ids: string[] = []
  let cursor = 0
  for (let i = 0; i < pairCount; i++) {
    const isBye = byePairIndices.has(i)
    const [player1Id, player2Id] = isBye
      ? fisherYatesShuffle([shuffledParticipants[cursor++], null])
      : [shuffledParticipants[cursor++], shuffledParticipants[cursor++]]
    const id = randomUUID()
    round1Ids.push(id)

    const winnerId = isBye ? player1Id ?? player2Id : null

    matches.push({
      id,
      round: 1,
      matchNumber: i + 1,
      player1Id,
      player2Id,
      winnerId,
      status: isBye ? "FINISHED" : "SCHEDULED",
      isBye,
      isThirdPlaceMatch: false,
      nextMatchId: null,
      nextMatchSlot: null,
      loserToMatchId: null,
      loserToSlot: null,
    })
  }
  matchIdsByRound.push(round1Ids)

  // Rounds 2..rounds: empty shells, pre-filled with bye winners where known.
  for (let r = 2; r <= rounds; r++) {
    const prevIds = matchIdsByRound[r - 2]
    const prevMatches = matches.filter((m) => prevIds.includes(m.id))
    const roundIds: string[] = []

    for (let i = 0; i < prevIds.length / 2; i++) {
      const feeder1 = prevMatches[i * 2]
      const feeder2 = prevMatches[i * 2 + 1]
      const id = randomUUID()
      roundIds.push(id)

      feeder1.nextMatchId = id
      feeder1.nextMatchSlot = 1
      feeder2.nextMatchId = id
      feeder2.nextMatchSlot = 2

      // If a feeder already resolved via bye, its winner fills this slot now —
      // but this match itself is always a real, unplayed match (SCHEDULED),
      // even if both feeders happened to be byes: two bye-advanced players
      // still have to actually play each other.
      const player1Id = feeder1.isBye ? feeder1.winnerId : null
      const player2Id = feeder2.isBye ? feeder2.winnerId : null

      matches.push({
        id,
        round: r,
        matchNumber: i + 1,
        player1Id,
        player2Id,
        winnerId: null,
        status: "SCHEDULED",
        isBye: false,
        isThirdPlaceMatch: false,
        nextMatchId: null,
        nextMatchSlot: null,
        loserToMatchId: null,
        loserToSlot: null,
      })
    }
    matchIdsByRound.push(roundIds)
  }

  // Bronze match: only when a semifinal round exists (rounds >= 2).
  if (rounds >= 2) {
    const finalMatch = matches.find((m) => m.round === rounds)!
    const semifinalIds = matchIdsByRound[rounds - 2]
    const semifinalMatches = matches.filter((m) => semifinalIds.includes(m.id))

    const bronzeId = randomUUID()
    matches.push({
      id: bronzeId,
      round: rounds,
      matchNumber: finalMatch.matchNumber + 1,
      player1Id: null,
      player2Id: null,
      winnerId: null,
      status: "SCHEDULED",
      isBye: false,
      isThirdPlaceMatch: true,
      nextMatchId: null,
      nextMatchSlot: null,
      loserToMatchId: null,
      loserToSlot: null,
    })

    semifinalMatches.forEach((m, i) => {
      // A bye semifinal has no loser to advance — leave its wiring unset.
      if (!m.isBye) {
        m.loserToMatchId = bronzeId
        m.loserToSlot = i + 1
      }
    })
  }

  return { rounds, matches, seeds }
}

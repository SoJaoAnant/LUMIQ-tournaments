import { z } from "zod"

const datetimeLocalString = z.string().min(1, "Required").refine((v) => !isNaN(Date.parse(v)), {
  message: "Invalid date",
})

export const tournamentFormSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    registrationOpen: datetimeLocalString,
    registrationClose: datetimeLocalString,
  })
  .refine((data) => new Date(data.registrationClose) > new Date(data.registrationOpen), {
    message: "Registration close must be after registration open",
    path: ["registrationClose"],
  })

/** Raw form shape — datetime-local inputs are plain strings until the Server Action converts them. */
export type TournamentFormInput = z.infer<typeof tournamentFormSchema>

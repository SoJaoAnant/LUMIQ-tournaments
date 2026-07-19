import { z } from "zod"

export const pitchSchema = z
  .string()
  .trim()
  .min(1, "Add a short pitch so people know why to back you")
  .max(140, "Keep it under 140 characters")

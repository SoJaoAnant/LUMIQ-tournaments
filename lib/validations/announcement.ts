import { z } from "zod"

export const announcementFormSchema = z.object({
  title: z.string().trim().min(2, "Title is required").max(160),
  content: z.string().trim().min(2, "Content is required").max(4000),
})

export type AnnouncementFormValues = z.infer<typeof announcementFormSchema>

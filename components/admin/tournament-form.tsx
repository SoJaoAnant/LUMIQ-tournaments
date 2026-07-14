"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { tournamentFormSchema, type TournamentFormInput } from "@/lib/validations/tournament"
import { createTournament, updateTournament } from "@/lib/actions/tournaments"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

export function TournamentForm({
  tournament,
}: {
  tournament?: {
    id: string
    title: string
    description: string | null
    registrationOpen: Date
    registrationClose: Date
  }
}) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<TournamentFormInput>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: {
      title: tournament?.title ?? "",
      description: tournament?.description ?? "",
      registrationOpen: tournament ? toLocalInputValue(tournament.registrationOpen) : "",
      registrationClose: tournament ? toLocalInputValue(tournament.registrationClose) : "",
    },
  })

  async function onSubmit(values: TournamentFormInput) {
    setSubmitting(true)
    try {
      if (tournament) {
        await updateTournament(tournament.id, values)
        toast.success("Tournament updated")
      } else {
        await createTournament(values)
        toast.success("Tournament created")
      }
      router.push("/admin/tournaments")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 max-w-xl">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Summer Ping Pong Championship" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="Optional details, format, venue…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="registrationOpen"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Opens</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="registrationClose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Closes</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={submitting} loading={submitting} className="w-fit">
          {tournament ? "Save Changes" : "Create Tournament"}
        </Button>
      </form>
    </Form>
  )
}

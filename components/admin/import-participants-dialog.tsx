"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Papa from "papaparse"
import { toast } from "sonner"
import { Upload } from "lucide-react"

import { importParticipants } from "@/lib/actions/participants"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

function extractEmails(rows: string[][]): string[] {
  return rows
    .flat()
    .map((cell) => cell.trim())
    .filter((cell) => cell.includes("@"))
}

export function ImportParticipantsDialog({ tournamentId }: { tournamentId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [emailsText, setEmailsText] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function handleFile(file: File) {
    Papa.parse<string[]>(file, {
      complete: (result) => {
        const emails = extractEmails(result.data)
        setEmailsText((prev) => Array.from(new Set([...prev.split(/\s|,/).filter(Boolean), ...emails])).join("\n"))
      },
    })
  }

  async function handleSubmit() {
    const emails = emailsText
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter(Boolean)

    if (emails.length === 0) {
      toast.error("Add at least one email")
      return
    }

    setSubmitting(true)
    try {
      const result = await importParticipants(tournamentId, emails)
      toast.success(
        `Imported ${result.imported}. ${result.alreadyJoined} already joined. ${result.notFound.length} not found.`
      )
      setEmailsText("")
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Upload className="size-4" />
        Import Participants
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Participants</DialogTitle>
          <DialogDescription>
            Upload a CSV of emails, or paste them below (one per line or comma-separated).
            Only emails matching an existing account will be added.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="csv-file" className="mb-1.5 block">
              CSV file
            </Label>
            <input
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
              className="w-full text-sm"
            />
          </div>
          <div>
            <Label htmlFor="emails" className="mb-1.5 block">
              Emails
            </Label>
            <Textarea
              id="emails"
              rows={6}
              placeholder="anant.sinha@lumiq.ai&#10;priya.rao@lumiq.ai"
              value={emailsText}
              onChange={(e) => setEmailsText(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={submitting} loading={submitting} onClick={handleSubmit}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

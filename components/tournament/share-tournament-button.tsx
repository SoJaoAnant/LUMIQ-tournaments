"use client"

import { useState } from "react"
import { Check, Share2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

export function ShareTournamentButton({ tournamentId }: { tournamentId: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/tournaments/${tournamentId}`

    if (navigator.share) {
      try {
        await navigator.share({ title: "Join this tournament", url })
      } catch {
        // User cancelled the native share sheet — not an error.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied — whoever opens it lands right here after signing in.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy the link")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? <Check className="size-3.5" /> : <Share2 className="size-3.5" />}
      Share
    </Button>
  )
}

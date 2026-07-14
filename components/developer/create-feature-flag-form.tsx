"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { createFeatureFlag } from "@/lib/actions/feature-flags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CreateFeatureFlagForm() {
  const router = useRouter()
  const [key, setKey] = useState("")
  const [description, setDescription] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      try {
        await createFeatureFlag(key, description)
        toast.success("Feature flag created")
        setKey("")
        setDescription("")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't create flag")
      }
    })
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Input placeholder="flag_key" value={key} onChange={(e) => setKey(e.target.value)} />
      <Input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button disabled={!key || isPending} loading={isPending} onClick={handleSubmit} className="shrink-0">
        Add Flag
      </Button>
    </div>
  )
}

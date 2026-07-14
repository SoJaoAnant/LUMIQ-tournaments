"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { User } from "@prisma/client"

import { findUserByEmail, setUserRole } from "@/lib/actions/developer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PromoteUserForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [found, setFound] = useState<User | null | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  function handleSearch() {
    startTransition(async () => {
      const user = await findUserByEmail(email)
      setFound(user)
      if (!user) toast.error("No account found for that email — they need to sign in at least once first.")
    })
  }

  function handlePromote() {
    if (!found) return
    startTransition(async () => {
      try {
        await setUserRole(found.id, "ADMIN")
        toast.success(`${found.name} is now an admin`)
        setFound(null)
        setEmail("")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't promote user")
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          placeholder="anant.sinha@lumiq.ai"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="outline" disabled={!email || isPending} onClick={handleSearch}>
          Find
        </Button>
      </div>
      {found && (
        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="font-medium">{found.name}</p>
            <p className="text-xs text-muted-foreground">
              {found.email} · currently {found.role}
            </p>
          </div>
          <Button disabled={isPending || found.role !== "USER"} onClick={handlePromote}>
            Make Admin
          </Button>
        </div>
      )}
    </div>
  )
}

"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { Role } from "@prisma/client"

import { setUserRole } from "@/lib/actions/developer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function RoleSelect({
  userId,
  role,
  disabled,
}: {
  userId: string
  role: Role
  disabled?: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <Select
      value={role}
      disabled={disabled || isPending}
      onValueChange={(value) =>
        startTransition(async () => {
          try {
            await setUserRole(userId, value as Role)
            toast.success("Role updated")
            router.refresh()
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't update role")
          }
        })
      }
    >
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USER">User</SelectItem>
        <SelectItem value="ADMIN">Admin</SelectItem>
        <SelectItem value="DEVELOPER">Developer</SelectItem>
      </SelectContent>
    </Select>
  )
}

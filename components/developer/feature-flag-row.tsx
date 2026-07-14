"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { setFeatureFlag } from "@/lib/actions/feature-flags"
import { Switch } from "@/components/ui/switch"

export function FeatureFlagRow({
  flagKey,
  description,
  enabled,
}: {
  flagKey: string
  description: string | null
  enabled: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-4">
      <div>
        <p className="font-medium">{flagKey}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={enabled}
        disabled={isPending}
        onCheckedChange={(checked) =>
          startTransition(async () => {
            try {
              await setFeatureFlag(flagKey, checked)
              toast.success(`${flagKey} ${checked ? "enabled" : "disabled"}`)
              router.refresh()
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Couldn't update flag")
            }
          })
        }
      />
    </div>
  )
}

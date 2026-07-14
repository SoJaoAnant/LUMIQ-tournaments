import { Flag } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FeatureFlagRow } from "@/components/developer/feature-flag-row"
import { CreateFeatureFlagForm } from "@/components/developer/create-feature-flag-form"
import { EmptyState } from "@/components/shared/empty-state"

export default async function DeveloperFeatureFlagsPage() {
  await requireRole("DEVELOPER")

  const flags = await db.featureFlag.findMany({ orderBy: { key: "asc" } })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Flag className="size-6 text-primary" />
          Feature Flags
        </h1>
        <p className="text-sm text-muted-foreground">
          Toggle platform-wide features on or off without a deploy.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Flag</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateFeatureFlagForm />
        </CardContent>
      </Card>

      {flags.length === 0 ? (
        <EmptyState icon={Flag} title="No feature flags yet" />
      ) : (
        <div className="flex flex-col gap-3">
          {flags.map((f) => (
            <FeatureFlagRow
              key={f.id}
              flagKey={f.key}
              description={f.description}
              enabled={f.enabled}
            />
          ))}
        </div>
      )}
    </div>
  )
}

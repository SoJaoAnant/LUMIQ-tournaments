import { Trophy } from "lucide-react"

import { cn } from "@/lib/utils"
import { gradientForKey } from "@/lib/gradient"

const SIZE_CLASS = {
  sm: "size-9 rounded-xl [&>svg]:size-4",
  default: "size-13 rounded-2xl [&>svg]:size-6",
  lg: "size-16 rounded-2xl [&>svg]:size-7",
}

export function TournamentIconTile({
  id,
  size = "default",
  className,
}: {
  id: string
  size?: keyof typeof SIZE_CLASS
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br text-white shadow-md",
        gradientForKey(id),
        SIZE_CLASS[size],
        className
      )}
    >
      <Trophy strokeWidth={2.25} />
    </div>
  )
}

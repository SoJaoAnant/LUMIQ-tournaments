import { cn } from "@/lib/utils"
import { gradientForKey, initials } from "@/lib/gradient"

const SIZE_CLASS = {
  sm: "size-8 rounded-lg text-xs",
  default: "size-10 rounded-xl text-sm",
  lg: "size-14 rounded-2xl text-lg",
}

export function AvatarTile({
  name,
  size = "default",
  ring = false,
  className,
}: {
  name: string
  size?: keyof typeof SIZE_CLASS
  ring?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center bg-gradient-to-br font-heading font-bold text-white shadow-sm",
        gradientForKey(name),
        SIZE_CLASS[size],
        ring && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className
      )}
    >
      {initials(name)}
    </div>
  )
}

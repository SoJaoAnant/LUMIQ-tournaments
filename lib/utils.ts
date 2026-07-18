import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Only allows same-origin relative paths (e.g. `/tournaments/abc`) through as a
 * post-login redirect target — rejects absolute URLs and protocol-relative
 * `//host` paths so a crafted `?redirect_url=` can't be used to bounce a user
 * to an external site after they authenticate.
 */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path) return null
  if (!path.startsWith("/") || path.startsWith("//")) return null
  return path
}

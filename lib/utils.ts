import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Only allows same-origin relative paths (e.g. `/tournaments/abc`) through as a
 * post-login redirect target — rejects absolute URLs and protocol-relative
 * paths so a crafted `?redirect_url=` can't be used to bounce a user to an
 * external site after they authenticate.
 *
 * Resolves against a sentinel origin with the WHATWG URL parser (the same
 * parser browsers use) rather than checking string prefixes like `//` —
 * browsers normalize backslashes to forward slashes when resolving a URL, so
 * `/\evil.com` or `\/evil.com` would slip past a naive "doesn't start with //"
 * check while still resolving to `https://evil.com` in the browser.
 */
export function safeRedirectPath(path: string | null | undefined): string | null {
  if (!path) return null

  const sentinelOrigin = "http://internal.invalid"
  let resolved: URL
  try {
    resolved = new URL(path, sentinelOrigin)
  } catch {
    return null
  }

  if (resolved.origin !== sentinelOrigin) return null
  return resolved.pathname + resolved.search + resolved.hash
}

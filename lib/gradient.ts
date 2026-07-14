const GRADIENTS = [
  "from-primary to-accent",
  "from-accent to-primary",
  "from-secondary to-primary",
  "from-primary via-secondary to-accent",
  "from-accent via-secondary to-primary",
  "from-secondary to-accent",
]

/** Stable per-key gradient pick so the same tournament/player always renders the same colors. */
export function gradientForKey(key: string) {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

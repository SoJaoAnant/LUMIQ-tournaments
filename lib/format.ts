import { formatDistanceToNowStrict } from "date-fns"

export function timeAgo(date: Date) {
  return `${formatDistanceToNowStrict(date)} ago`
}

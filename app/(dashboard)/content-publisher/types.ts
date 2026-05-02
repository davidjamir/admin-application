export type PublisherPlatform = "facebook" | "instagram" | "threads" | "tiktok" | "x"

export interface ContentPublisherRow {
  id: string
  itemId: string
  page: string | null
  topic: string | null
  chatId: string | null
  scheduleAt: number
  createdAt: number
  primaryTs: number
  linkUrl: string | null
  previewTitle: string
  previewBody: string
  /** Article / Telegram image URLs when present. */
  thumbnailUrl?: string | null
  pipeline?: string | null
  itemStatus?: string | null
  contentType?: string | null
  /** Non-HTTP `link` (e.g. viral internal id); shown when `linkUrl` is null. */
  internalLinkHint?: string | null
  raw: Record<string, unknown>
}

export interface ContentPublisherResponse {
  items: ContentPublisherRow[]
  topics: string[]
  total: number
  error?: string
}

export const PLATFORMS: { id: PublisherPlatform; label: string }[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "threads", label: "Threads" },
  { id: "tiktok", label: "TikTok" },
  { id: "x", label: "X" },
]

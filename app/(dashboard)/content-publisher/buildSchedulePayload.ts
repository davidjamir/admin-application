import type { ContentPublisherRow } from "./types"

function pickString(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return ""
}

function stringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const out: string[] = []
  for (const x of v) {
    if (typeof x === "string" && x.trim()) out.push(x.trim())
  }
  return out
}

/**
 * Đúng cấu trúc upstream nhận:
 * `const { chatId, chatName, chatType, flags, tags, text, topics, images, videos, contentType, link } = body`
 *
 * `link` — khóa nhận diện bản ghi đã có trong DB (URL bài hoặc id nội bộ); không gửi full `raw` hay metadata admin.
 * Trong `flags` (thứ tự): `type`, `modeSocial`, `page`, `schedule`, rồi merge từ `raw.flags` (không ghi đè các key này).
 */
export type ScheduleToggle = "on" | "off"

export interface SchedulePublishBody {
  chatId: string | number | ""
  chatName: string
  chatType: string
  flags: Record<string, unknown> & {
    type: "social"
    modeSocial: "auto"
    page: string
    schedule: ScheduleToggle
  }
  tags: unknown[]
  text: string
  topics: string[]
  images: string[]
  videos: string[]
  contentType: string
  /** Khớp record có sẵn — ưu tiên URL http(s), sau đó link/id trong document */
  link: string
}

function rowPipelineKey(row: ContentPublisherRow, raw: Record<string, unknown>): string {
  const p =
    (typeof row.pipeline === "string" && row.pipeline.trim()) ||
    (typeof raw.pipeline === "string" && raw.pipeline.trim()) ||
    ""
  return p.toLowerCase()
}

function resolveDbLink(row: ContentPublisherRow, raw: Record<string, unknown>): string {
  const http =
    row.linkUrl?.trim() ||
    pickString(raw, ["link", "url", "articleUrl", "permalink", "shareUrl", "href"])
  if (http) return http

  const internal =
    row.internalLinkHint?.trim() ||
    pickString(raw, ["link", "url", "articleUrl", "guid"]) ||
    (typeof raw.itemId === "string" ? raw.itemId.trim() : "")

  return internal || row.itemId || ""
}

export function buildSchedulePublishPayload(
  row: ContentPublisherRow,
  opts: {
    /** Khi chọn Channel ở bulk panel — khớp entry trong `pages[]` */
    chatNameOverride?: string
    schedule: ScheduleToggle
    /** Target page đã chọn — `flags.page` */
    page: string
  }
): SchedulePublishBody {
  const raw = row.raw as Record<string, unknown>

  const chatName =
    opts.chatNameOverride?.trim() ||
    row.channel?.trim() ||
    pickString(raw, ["chatName"]) ||
    ""

  let chatId: string | number | null = null
  let chatType = ""

  const rawPages = raw.pages
  if (Array.isArray(rawPages) && chatName) {
    for (const entry of rawPages) {
      if (!entry || typeof entry !== "object") continue
      const e = entry as Record<string, unknown>
      const cn = typeof e.chatName === "string" ? e.chatName.trim() : ""
      if (cn === chatName) {
        const rc = e.requestChatId
        if (typeof rc === "string" || typeof rc === "number") chatId = rc
        if (typeof e.chatType === "string" && e.chatType.trim()) chatType = e.chatType.trim()
        break
      }
    }
  }

  if (chatId == null) {
    const root = raw.chatId
    if (typeof root === "string" || typeof root === "number") chatId = root
  }
  if (!chatType) {
    const t = raw.chatType
    if (typeof t === "string" && t.trim()) chatType = t.trim()
  }

  const topicList = stringArray(raw.topics)
  const topics = topicList.length > 0 ? topicList : row.topic ? [row.topic] : []

  const link = resolveDbLink(row, raw)

  const baseText =
    [row.previewTitle, row.previewBody].filter(Boolean).join("\n\n").trim() ||
    pickString(raw, ["message", "caption", "text", "snippet", "description"]) ||
    ""

  const text =
    link.trim().length > 0
      ? `${baseText}${baseText ? "\n\n" : ""}Link: ${link.trim()}`
      : baseText

  const isTraffic = rowPipelineKey(row, raw) === "traffic"
  const images = isTraffic ? [] : stringArray(raw.images)
  const videos = isTraffic ? [] : stringArray(raw.videos)

  const contentType = isTraffic
    ? ""
    : (row.contentType?.trim() ?? "") ||
      pickString(raw, ["contentType"]) ||
      ""

  const tags = Array.isArray(raw.tags) ? raw.tags : []

  const baseFlags =
    raw.flags !== undefined &&
    typeof raw.flags === "object" &&
    raw.flags !== null &&
    !Array.isArray(raw.flags)
      ? ({ ...(raw.flags as Record<string, unknown>) } as Record<string, unknown>)
      : {}

  const reservedFlagKeys = new Set(["type", "modeSocial", "page", "schedule"])
  const restFlags = Object.fromEntries(
    Object.entries(baseFlags).filter(([k]) => !reservedFlagKeys.has(k))
  )

  const flags = {
    type: "social" as const,
    modeSocial: "auto" as const,
    page: opts.page,
    schedule: opts.schedule,
    ...restFlags,
  } as SchedulePublishBody["flags"]

  return {
    chatId: chatId ?? "",
    chatName,
    chatType,
    flags,
    tags,
    text,
    topics,
    images,
    videos,
    contentType,
    link,
  }
}

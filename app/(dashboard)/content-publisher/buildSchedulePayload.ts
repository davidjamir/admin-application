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
 *
 * `flags` — **mảng** chuỗi `key:value` (chỉ dấu `:` đầu tiên tách key/value), ví dụ:
 * `["type:social","modeSocial:auto","schedule:on","page:Minnesota Wolves FanHub"]`
 * Thứ tự cố định cho 4 flag hệ thống, sau đó nối thêm từ `raw.flags` (không trùng key `type|modeSocial|page|schedule`).
 */
export type ScheduleToggle = "on" | "off"

const RESERVED_FLAG_KEYS = new Set(["type", "modeSocial", "page", "schedule"])

function flagKeyFromEntry(s: string): string | null {
  const i = s.indexOf(":")
  if (i <= 0) return null
  return s.slice(0, i).trim()
}

/** Chuỗi bổ sung từ document (object legacy hoặc mảng `key:value`) — bỏ qua key đã dành cho cụm chuẩn. */
function extraFlagStringsFromRaw(rawFlags: unknown): string[] {
  if (Array.isArray(rawFlags)) {
    const out: string[] = []
    for (const x of rawFlags) {
      if (typeof x !== "string" || !x.trim()) continue
      const t = x.trim()
      const k = flagKeyFromEntry(t)
      if (!k || RESERVED_FLAG_KEYS.has(k)) continue
      out.push(t)
    }
    return out
  }
  if (rawFlags && typeof rawFlags === "object" && !Array.isArray(rawFlags)) {
    const out: string[] = []
    for (const [key, val] of Object.entries(rawFlags as Record<string, unknown>)) {
      if (RESERVED_FLAG_KEYS.has(key)) continue
      if (val === undefined || val === null) continue
      out.push(`${key}:${String(val)}`)
    }
    return out
  }
  return []
}

export interface SchedulePublishBody {
  chatId: string | number | ""
  chatName: string
  chatType: string
  /** `["type:social","modeSocial:auto","schedule:on","page:…", ...extras]` */
  flags: string[]
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
    /** Target page đã chọn — thành phần `page:…` trong mảng `flags` */
    page: string
  }
): SchedulePublishBody {
  const raw = row.raw as Record<string, unknown>

  const chatName =
    opts.chatNameOverride?.trim() ||
    row.chatName?.trim() ||
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
    const rid = row.chatId
    if (typeof rid === "string" || typeof rid === "number") chatId = rid
  }
  if (chatId == null) {
    const root = raw.chatId
    if (typeof root === "string" || typeof root === "number") chatId = root
  }
  if (!chatType) {
    chatType = row.chatType?.trim() ?? ""
  }
  if (!chatType) {
    const t = raw.chatType
    if (typeof t === "string" && t.trim()) chatType = t.trim()
  }

  const topicList = stringArray(raw.topics)
  const topics = topicList.length > 0 ? topicList : row.topic ? [row.topic] : []

  const link = resolveDbLink(row, raw)

  const text =
    [row.previewTitle, row.previewBody].filter(Boolean).join("\n\n").trim() ||
    pickString(raw, ["message", "caption", "text", "snippet", "description"]) ||
    ""

  const isTraffic = rowPipelineKey(row, raw) === "traffic"
  const images = isTraffic ? [] : stringArray(raw.images)
  const videos = isTraffic ? [] : stringArray(raw.videos)

  const contentType = isTraffic
    ? ""
    : (row.contentType?.trim() ?? "") ||
      pickString(raw, ["contentType"]) ||
      ""

  const tags = Array.isArray(raw.tags) ? raw.tags : []

  const flags: string[] = [
    "type:social",
    "modeSocial:auto",
    `schedule:${opts.schedule}`,
    `page:${opts.page}`,
    ...extraFlagStringsFromRaw(raw.flags),
  ]

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

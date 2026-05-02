import { NextResponse } from "next/server"
import type { Collection, Document } from "mongodb"
import { getDb, getSocialItemsDb } from "@/lib/mongodb"
import type { ContentPublisherRow } from "@/app/(dashboard)/content-publisher/types"

const SOCIAL_COLL = process.env.MONGODB_SOCIAL_COLLECTION?.trim() || "social"

function toMs(val: unknown, fallback: number): number {
  if (val == null) return fallback
  if (typeof val === "number" && !Number.isNaN(val)) return val
  if (typeof val === "object" && val !== null && "$date" in val) {
    const d = (val as { $date: string | number | Date }).$date
    return new Date(d).getTime()
  }
  if (val instanceof Date) return val.getTime()
  if (typeof val === "string" || typeof val === "number") {
    const t = new Date(val).getTime()
    return Number.isNaN(t) ? fallback : t
  }
  return fallback
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === "string" && v.trim()) return v.trim()
  }
  return null
}

function normalizeHttpUrl(raw: string | null): string | null {
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return null
}

function thumbnailFromDoc(flat: Record<string, unknown>): string | null {
  const fi = flat.featuredImage
  if (typeof fi === "string" && /^https?:\/\//i.test(fi)) return fi
  const images = flat.images
  if (Array.isArray(images)) {
    for (const u of images) {
      if (typeof u === "string" && /^https?:\/\//i.test(u)) return u
    }
  }
  const media = flat.media
  if (Array.isArray(media)) {
    for (const m of media) {
      if (m && typeof m === "object" && typeof (m as { url?: string }).url === "string") {
        const url = (m as { url: string }).url
        if (/^https?:\/\//i.test(url)) return url
      }
    }
  }
  return null
}

function summarizePages(rawPages: unknown): {
  pageLabel: string | null
  primaryTopic: string | null
  primaryChatId: string | null
} {
  if (!Array.isArray(rawPages) || rawPages.length === 0) {
    return { pageLabel: null, primaryTopic: null, primaryChatId: null }
  }

  const names: string[] = []
  let primaryTopic: string | null = null
  let primaryChatId: string | null = null

  for (const entry of rawPages) {
    if (!entry || typeof entry !== "object") continue
    const p = entry as Record<string, unknown>
    if (typeof p.page === "string" && p.page.trim()) names.push(p.page.trim())
    if (
      typeof p.topic === "string" &&
      p.topic.trim() &&
      primaryTopic == null
    ) {
      primaryTopic = p.topic.trim()
    }
    if (
      typeof p.requestChatId === "string" &&
      p.requestChatId.trim() &&
      primaryChatId == null
    ) {
      primaryChatId = p.requestChatId.trim()
    }
  }

  let pageLabel: string | null = null
  if (names.length === 1) pageLabel = names[0]
  else if (names.length === 2) pageLabel = names.join(", ")
  else if (names.length > 2) pageLabel = `${names[0]}, +${names.length - 1}`

  return { pageLabel, primaryTopic, primaryChatId }
}

function docTopics(flat: Record<string, unknown>, primaryTopicFromPages: string | null): Set<string> {
  const seen = new Set<string>()
  const rootTopics = flat.topics
  if (Array.isArray(rootTopics)) {
    for (const t of rootTopics) {
      if (typeof t === "string" && t.trim()) seen.add(t.trim())
    }
  }
  const rawPages = flat.pages
  if (Array.isArray(rawPages)) {
    for (const entry of rawPages) {
      if (!entry || typeof entry !== "object") continue
      const topic = (entry as { topic?: string }).topic
      if (typeof topic === "string" && topic.trim()) seen.add(topic.trim())
    }
  }
  if (primaryTopicFromPages) seen.add(primaryTopicFromPages)
  return seen
}

function mapSocialDoc(
  doc: Document,
  now: number,
  pageTopic: Map<string, string | undefined>
): ContentPublisherRow {
  const _id = (doc._id as { toString(): string }).toString()
  const flat = doc as Record<string, unknown>
  const itemId = String(flat.itemId ?? _id.slice(-12))

  const { pageLabel, primaryTopic: pagePrimaryTopic, primaryChatId } = summarizePages(flat.pages)

  const rootTopic =
    Array.isArray(flat.topics) &&
    typeof flat.topics[0] === "string" &&
    flat.topics[0].trim()
      ? flat.topics[0].trim()
      : null

  const inferredTopic =
    pagePrimaryTopic ||
    rootTopic ||
    (() => {
      if (!pageLabel) return null
      const anchor = pageLabel.split(",")[0]?.trim()
      if (!anchor) return null
      return pageTopic.get(anchor) ?? null
    })()

  const createdAtMs = toMs(flat.createdAt, now)
  const updatedAtMs = toMs(flat.updatedAt, createdAtMs)
  const publishedAtMs = toMs(flat.publishedAt, 0)
  const queuedAtMs = toMs(flat.queuedAt, 0)
  const crawledAtMs = toMs(flat.crawledAt, 0)

  const primaryTs = Math.max(
    updatedAtMs,
    createdAtMs,
    publishedAtMs,
    queuedAtMs,
    crawledAtMs
  )

  const rawLink =
    pickString(flat, ["link", "url", "articleUrl", "permalink", "href", "shareUrl"]) || null

  const linkUrl = normalizeHttpUrl(rawLink)

  const previewTitle =
    pickString(flat, ["title", "headline", "subject", "name"]) || `Post ${itemId.slice(0, 8)}…`

  const previewBody =
    pickString(flat, [
      "snippet",
      "crawlSnippet",
      "caption",
      "message",
      "text",
      "content",
      "description",
      "body",
    ]) ||
    flattenHtmlSnippet(flat.html) ||
    ""

  const pipeline = typeof flat.pipeline === "string" ? flat.pipeline : null
  const itemStatus = typeof flat.status === "string" ? flat.status : null
  const contentType =
    typeof flat.contentType === "string"
      ? flat.contentType
      : Array.isArray(flat.images) && flat.images.length > 0 && !linkUrl
        ? "image"
        : null

  const thumbnailUrl = thumbnailFromDoc(flat)

  const scheduleCandidate = queuedAtMs || publishedAtMs || crawledAtMs || createdAtMs

  return {
    id: _id,
    itemId,
    page: pageLabel,
    topic: inferredTopic || null,
    chatId: primaryChatId || null,
    scheduleAt: scheduleCandidate || primaryTs || createdAtMs,
    createdAt: createdAtMs,
    primaryTs,
    linkUrl,
    previewTitle,
    previewBody,
    thumbnailUrl,
    pipeline,
    itemStatus,
    contentType,
    internalLinkHint: rawLink && !linkUrl ? rawLink : null,
    raw: flat as Record<string, unknown>,
  }
}

function flattenHtmlSnippet(html: unknown): string {
  if (typeof html !== "string" || !html.trim()) return ""
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 280)
}

async function mergedTopicOptions(
  primaryDbTopics: string[],
  socialCol: Collection<Document>
): Promise<string[]> {
  const merged = new Set<string>(primaryDbTopics)
  const sample = await socialCol
    .find({}, { projection: { topics: 1, pages: { topic: 1 } } })
    .limit(4000)
    .toArray()

  for (const d of sample) {
    const flat = d as Record<string, unknown>
    const { primaryTopic } = summarizePages(flat.pages)
    for (const t of docTopics(flat, primaryTopic)) merged.add(t)
  }

  return Array.from(merged).sort((a, b) => a.localeCompare(b))
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("search") || "").trim()
    const topic = (searchParams.get("topic") || "").trim()
    const chatId = (searchParams.get("chatId") || "").trim()
    const pipeline = (searchParams.get("pipeline") || "").trim().toLowerCase()
    const dateFrom = searchParams.get("dateFrom") || ""
    const dateTo = searchParams.get("dateTo") || ""

    const primaryDb = await getDb()

    const pages = (await primaryDb
      .collection("pages")
      .find({}, { projection: { name: 1, topic: 1 } })
      .toArray()) as { name?: string; topic?: string }[]

    const pageTopic = new Map<string, string | undefined>()
    for (const p of pages) {
      if (p.name) pageTopic.set(p.name, p.topic)
    }

    const primaryTopicsDistinct = Array.from(
      new Set(
        pages
          .map((p) => (typeof p.topic === "string" ? p.topic.trim() : ""))
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b))

    const socialDb = await getSocialItemsDb()
    const socialCol = socialDb.collection(SOCIAL_COLL)

    const distinctTopics = await mergedTopicOptions(primaryTopicsDistinct, socialCol)

    const andClauses: Document[] = []

    if (pipeline === "traffic" || pipeline === "viral") {
      andClauses.push({ pipeline })
    }

    if (topic) {
      andClauses.push({
        $or: [{ topics: topic }, { "pages.topic": topic }],
      })
    }

    if (chatId) {
      andClauses.push({ "pages.requestChatId": chatId })
    }

    const mongoFilter: Document = andClauses.length ? { $and: andClauses } : {}

    const rawDocs = (await socialCol.find(mongoFilter).limit(800).toArray()) as Document[]

    const now = Date.now()

    let edgeFrom = 0
    let edgeTo = Number.POSITIVE_INFINITY
    if (dateFrom) {
      edgeFrom = new Date(`${dateFrom}T00:00:00+07:00`).getTime()
    }
    if (dateTo) {
      edgeTo = new Date(`${dateTo}T23:59:59.999+07:00`).getTime()
    }

    const rows = rawDocs.map((doc) => mapSocialDoc(doc, now, pageTopic)).filter((row) => {
      if (dateFrom || dateTo) {
        if (row.primaryTs < edgeFrom || row.primaryTs > edgeTo) return false
      }
      if (!search) return true
      const q = search.toLowerCase()
      const batchId = typeof row.raw.batchId === "string" ? row.raw.batchId : ""
      const guid = typeof row.raw.guid === "string" ? row.raw.guid : ""

      const topicMatchDoc = [...docTopics(row.raw as Record<string, unknown>, row.topic)].some((t) =>
        t.toLowerCase().includes(q)
      )

      return (
        row.itemId.toLowerCase().includes(q) ||
        (row.page?.toLowerCase().includes(q) ?? false) ||
        (row.topic?.toLowerCase().includes(q) ?? false) ||
        topicMatchDoc ||
        (row.chatId?.toLowerCase().includes(q) ?? false) ||
        row.previewTitle.toLowerCase().includes(q) ||
        row.previewBody.toLowerCase().includes(q) ||
        (row.linkUrl?.toLowerCase().includes(q) ?? false) ||
        batchId.toLowerCase().includes(q) ||
        guid.toLowerCase().includes(q) ||
        (typeof row.pipeline === "string" && row.pipeline.toLowerCase().includes(q)) ||
        (typeof row.raw.itemId === "string" && row.raw.itemId.toLowerCase().includes(q))
      )
    })

    const items = [...rows].sort((a, b) => b.primaryTs - a.primaryTs)

    return NextResponse.json({
      items,
      topics: distinctTopics,
      total: items.length,
    })
  } catch (error: unknown) {
    console.error("[content-publisher GET]", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

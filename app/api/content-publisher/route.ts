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

function escapeRegexLiteral(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
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
  channelLabel: string | null
} {
  if (!Array.isArray(rawPages) || rawPages.length === 0) {
    return { pageLabel: null, primaryTopic: null, channelLabel: null }
  }

  const names: string[] = []
  let primaryTopic: string | null = null
  const channelNames: string[] = []

  for (const entry of rawPages) {
    if (!entry || typeof entry !== "object") continue
    const p = entry as Record<string, unknown>
    if (typeof p.page === "string" && p.page.trim()) names.push(p.page.trim())
    if (typeof p.topic === "string" && p.topic.trim() && primaryTopic == null) {
      primaryTopic = p.topic.trim()
    }
    if (typeof p.chatName === "string" && p.chatName.trim()) {
      channelNames.push(p.chatName.trim())
    }
  }

  let pageLabel: string | null = null
  if (names.length === 1) pageLabel = names[0]
  else if (names.length === 2) pageLabel = names.join(", ")
  else if (names.length > 2) pageLabel = `${names[0]}, +${names.length - 1}`

  const uniqChannels = [...new Set(channelNames)]
  let channelLabel: string | null = null
  if (uniqChannels.length === 1) channelLabel = uniqChannels[0]
  else if (uniqChannels.length === 2) channelLabel = uniqChannels.join(", ")
  else if (uniqChannels.length > 2)
    channelLabel = `${uniqChannels[0]}, +${uniqChannels.length - 1}`

  return { pageLabel, primaryTopic, channelLabel }
}

function docChatNamesFlat(flat: Record<string, unknown>): Set<string> {
  const seen = new Set<string>()
  const root = flat.chatName
  if (typeof root === "string" && root.trim()) seen.add(root.trim())
  const rawPages = flat.pages
  if (Array.isArray(rawPages)) {
    for (const entry of rawPages) {
      if (!entry || typeof entry !== "object") continue
      const cn = (entry as { chatName?: string }).chatName
      if (typeof cn === "string" && cn.trim()) seen.add(cn.trim())
    }
  }
  return seen
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

  const { pageLabel, primaryTopic: pagePrimaryTopic, channelLabel } = summarizePages(flat.pages)

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

  const rootChatName =
    typeof flat.chatName === "string" && flat.chatName.trim() ? flat.chatName.trim() : null

  let rootChatId: string | number | null = null
  const cid = flat.chatId
  if (typeof cid === "string" || typeof cid === "number") rootChatId = cid
  else if (cid != null && typeof cid === "object" && typeof (cid as { toString(): string }).toString === "function") {
    rootChatId = (cid as { toString(): string }).toString()
  }

  const rootChatType =
    typeof flat.chatType === "string" && flat.chatType.trim() ? flat.chatType.trim() : null

  const scheduleCandidate = queuedAtMs || publishedAtMs || crawledAtMs || createdAtMs

  return {
    id: _id,
    itemId,
    page: pageLabel,
    topic: inferredTopic || null,
    channel: channelLabel || null,
    chatName: rootChatName,
    chatId: rootChatId,
    chatType: rootChatType,
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

/** Fallback when aggregation is unavailable — sampled distinct chat names. */
async function mergedChannelOptionsSampled(socialCol: Collection<Document>): Promise<string[]> {
  const merged = new Set<string>()
  const sample = await socialCol
    .find({}, { projection: { chatName: 1, pages: { chatName: 1 } } })
    .limit(4000)
    .toArray()

  for (const d of sample) {
    for (const c of docChatNamesFlat(d as Record<string, unknown>)) merged.add(c)
  }

  return Array.from(merged).sort((a, b) => a.localeCompare(b))
}

/** Every distinct non-empty root `chatName` and `pages[].chatName` in the social collection. */
async function distinctAllChatNamesFromSocial(
  socialCol: Collection<Document>
): Promise<string[]> {
  try {
    const agg = await socialCol
      .aggregate<{ _id: string }>(
        [
          {
            $project: {
              _names: {
                $setUnion: [
                  {
                    $cond: [
                      {
                        $and: [
                          { $eq: [{ $type: "$chatName" }, "string"] },
                          {
                            $gt: [{ $strLenCP: { $trim: { input: "$chatName" } } }, 0],
                          },
                        ],
                      },
                      [{ $trim: { input: "$chatName" } }],
                      [],
                    ],
                  },
                  {
                    $filter: {
                      input: {
                        $map: {
                          input: { $ifNull: ["$pages", []] },
                          as: "p",
                          in: "$$p.chatName",
                        },
                      },
                      as: "cn",
                      cond: {
                        $and: [
                          { $eq: [{ $type: "$$cn" }, "string"] },
                          { $gt: [{ $strLenCP: "$$cn" }, 0] },
                        ],
                      },
                    },
                  },
                ],
              },
            },
          },
          { $unwind: "$_names" },
          { $group: { _id: "$_names" } },
          { $sort: { _id: 1 } },
        ],
        { allowDiskUse: true }
      )
      .toArray()

    return agg.map((d) => String(d._id).trim()).filter(Boolean)
  } catch (e) {
    console.error("[content-publisher] distinctAllChatNamesFromSocial", e)
    return mergedChannelOptionsSampled(socialCol)
  }
}

function parseCreatedDayBoundsIct(
  ymd: string
): { startMs: number; endMsExclusive: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim())
  if (!m) return null
  const startMs = Date.parse(`${m[1]}-${m[2]}-${m[3]}T00:00:00.000+07:00`)
  if (!Number.isFinite(startMs)) return null
  return { startMs, endMsExclusive: startMs + 86_400_000 }
}

function createdAtInDayBounds(bounds: {
  startMs: number
  endMsExclusive: number
}): Document {
  return {
    $or: [
      {
        createdAt: {
          $gte: new Date(bounds.startMs),
          $lt: new Date(bounds.endMsExclusive),
        },
      },
      {
        createdAt: {
          $gte: bounds.startMs,
          $lt: bounds.endMsExclusive,
        },
      },
    ],
  }
}

/** Any `pages[]` row that looks wired to a real page/channel target */
function pageTargetElemMatchClause(): Document {
  const nonempty = /\S/
  return {
    pages: {
      $elemMatch: {
        $or: [
          { page: { $regex: nonempty } },
          { requestChatId: { $regex: nonempty } },
          {
            requestChatId: {
              $exists: true,
              $type: ["long", "int", "double", "decimal"],
            },
          },
        ],
      },
    },
  }
}

/** Items waiting to assign + schedule — no wired page target anywhere in `pages` */
function needsPageAssignmentClause(): Document {
  return { $nor: [pageTargetElemMatchClause()] }
}

function socialModeStrictInPagesClause(value: "auto" | "manual"): Document {
  const pat = new RegExp(`^${escapeRegexLiteral(value)}$`, "i")
  return {
    pages: {
      $elemMatch: {
        mode: { $regex: pat },
      },
    },
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = (searchParams.get("search") || "").trim()
    const topic = (searchParams.get("topic") || "").trim()
    const chatName = (searchParams.get("chatName") || "").trim()
    const pipelineFilter = (searchParams.get("pipeline") || "").trim().toLowerCase()
    const createdDayParam = (searchParams.get("createdDay") || "").trim()
    const socialModeParam = (searchParams.get("socialMode") || "").trim().toLowerCase()

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

    const [distinctTopics, distinctChannels] = await Promise.all([
      mergedTopicOptions(primaryTopicsDistinct, socialCol),
      distinctAllChatNamesFromSocial(socialCol),
    ])

    const andClauses: Document[] = []

    if (pipelineFilter === "traffic" || pipelineFilter === "viral") {
      andClauses.push({ pipeline: pipelineFilter })
    }

    if (topic) {
      andClauses.push({
        $or: [{ topics: topic }, { "pages.topic": topic }],
      })
    }

    if (chatName) {
      andClauses.push({
        $or: [{ chatName }, { pages: { $elemMatch: { chatName } } }],
      })
    }

    if (socialModeParam === "auto" || socialModeParam === "manual") {
      andClauses.push(socialModeStrictInPagesClause(socialModeParam))
    } else if (socialModeParam === "needs_page") {
      andClauses.push(needsPageAssignmentClause())
    }

    const dayBounds =
      createdDayParam.length >= 10 ? parseCreatedDayBoundsIct(createdDayParam) : null
    const listingClauses: Document[] =
      dayBounds !== null ? [...andClauses, createdAtInDayBounds(dayBounds)] : [...andClauses]

    const mongoFilter: Document = listingClauses.length ? { $and: listingClauses } : {}

    const aggMatch: Document = andClauses.length ? { $and: andClauses } : {}

    let createdDays: string[]
    try {
      const agg = await socialCol
        .aggregate([
          ...(Object.keys(aggMatch).length ? [{ $match: aggMatch }] : []),
          {
            $addFields: {
              _cdnorm: {
                $convert: { input: "$createdAt", to: "date", onError: null, onNull: null },
              },
            },
          },
          { $match: { _cdnorm: { $ne: null } } },
          {
            $project: {
              ymd: {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$_cdnorm",
                  timezone: "Asia/Ho_Chi_Minh",
                },
              },
            },
          },
          { $group: { _id: "$ymd" } },
          { $sort: { _id: -1 } },
        ])
        .toArray()

      createdDays = agg
        .map((doc) => (doc._id != null ? String(doc._id).trim() : ""))
        .filter((ymd) => /^\d{4}-\d{2}-\d{2}$/.test(ymd))
    } catch {
      createdDays = []
    }

    const rawDocs = (await socialCol.find(mongoFilter).limit(800).toArray()) as Document[]

    const now = Date.now()

    const rows = rawDocs.map((doc) => mapSocialDoc(doc, now, pageTopic)).filter((row) => {
      if (!search) return true
      const q = search.toLowerCase()
      const batchId = typeof row.raw.batchId === "string" ? row.raw.batchId : ""
      const guid = typeof row.raw.guid === "string" ? row.raw.guid : ""

      const topicMatchDoc = [...docTopics(row.raw as Record<string, unknown>, row.topic)].some((t) =>
        t.toLowerCase().includes(q)
      )
      const chatNameMatchDoc = [...docChatNamesFlat(row.raw as Record<string, unknown>)].some((c) =>
        c.toLowerCase().includes(q)
      )

      return (
        row.itemId.toLowerCase().includes(q) ||
        (row.page?.toLowerCase().includes(q) ?? false) ||
        (row.topic?.toLowerCase().includes(q) ?? false) ||
        (row.channel?.toLowerCase().includes(q) ?? false) ||
        (row.chatName?.toLowerCase().includes(q) ?? false) ||
        (row.chatType?.toLowerCase().includes(q) ?? false) ||
        (row.chatId != null && String(row.chatId).toLowerCase().includes(q)) ||
        topicMatchDoc ||
        chatNameMatchDoc ||
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
      channels: distinctChannels,
      createdDays,
      total: items.length,
    })
  } catch (error: unknown) {
    console.error("[content-publisher GET]", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

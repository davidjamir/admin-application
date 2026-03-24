import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

const CACHE_KEY = "website_manager_data"
const CACHE_TTL = 7200

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const force = searchParams.get("force") === "true"

  try {
    let payload: { blogs: unknown[]; wraps: unknown[]; quotas: unknown[]; fetchedAt: number } | null = force ? null : await redis.get(CACHE_KEY)

    if (!payload) {
      const db = await getDb()

      // Optimize: Only fetch quotas from the last 15 days
      const thresholdDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0].replace(/-/g, '')

      const [rawBlogs, rawWraps, rawQuotas] = await Promise.all([
        db.collection("blogs").find({}).sort({ createdAt: -1 }).toArray(),
        db.collection("wraps").find({}).sort({ createdAt: -1 }).toArray(),
        db.collection("quotas").find({ date: { $gte: thresholdDate } }).sort({ date: -1 }).toArray(),
      ])

      console.log(`[website-manager] Fetched ${rawQuotas.length} quotas since ${thresholdDate}`)

      const toMs = (v: unknown): number => {
        if (!v) return Date.now()
        if (typeof v === "object") {
          if ("$date" in v && v.$date) {
            return new Date(v.$date as string | number | Date).getTime()
          }
          if (v instanceof Date) return v.getTime()
        }
        if (typeof v === "number") return v
        if (typeof v === "string") return new Date(v).getTime()
        return Date.now()
      }

      const blogs = rawBlogs.map((d: Record<string, unknown>) => ({
        _id: (d._id as { toString(): string })?.toString(),
        blogDns: d.blogDns || "",
        blogEmail: d.blogEmail || "",
        blogIps: d.blogIps || "",
        blogName: d.blogName || "",
        blogSmtp: d.blogSmtp || "",
        blogType: d.blogType || "",
        isPublic: d.isPublic || false,
        createdAt: toMs(d.createdAt),
        updatedAt: toMs(d.updatedAt),
      }))

      const wraps = rawWraps.map((d: Record<string, unknown>) => ({
        _id: (d._id as { toString(): string })?.toString(),
        prefix: d.prefix || "",
        wrap_host: d.wrap_host || "",
        wrap_token: d.wrap_token || "",
        createdAt: toMs(d.createdAt),
        updatedAt: toMs(d.updatedAt),
      }))

      const quotas = rawQuotas.map((d: Record<string, unknown>) => ({
        _id: typeof d._id === "string" ? d._id : (d._id as { toString(): string })?.toString(),
        count: (d.count as number) ?? 0,
        date: (d.date as string) || "",
        domain: d.domain || "",
        key: d.key || "",
        limit: d.limit ?? 0,
        type: d.type || "",
        createdAt: toMs(d.createdAt),
        updatedAt: toMs(d.updatedAt),
      }))

      payload = { blogs, wraps, quotas, fetchedAt: Date.now() }
      await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL })
    }

    return NextResponse.json(payload)
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("[WEBSITES_GET_ERROR]", err)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

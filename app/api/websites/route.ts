import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

const CACHE_KEY = "website_manager_data"
const CACHE_TTL = 7200

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const force = searchParams.get("force") === "true"

  try {
    let payload: any = force ? null : await redis.get(CACHE_KEY)

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

      const toMs = (v: any): number => {
        if (!v) return Date.now()
        if (v.$date) return new Date(v.$date).getTime()
        if (v instanceof Date) return v.getTime()
        if (typeof v === "number") return v
        return new Date(v).getTime()
      }

      const blogs = rawBlogs.map((d: any) => ({
        _id: d._id?.toString(),
        blogDns: d.blogDns || "",
        blogEmail: d.blogEmail || "",
        blogIndex: d.blogIndex ?? 0,
        blogPassword: d.blogPassword || "",
        blogPriority: d.blogPriority ?? 0,
        blogUser: d.blogUser || "",
        channel: d.channel || "",
        enabled: d.enabled ?? true,
        wrapDomain: d.wrapDomain || "",
        createdAt: toMs(d.createdAt),
        updatedAt: toMs(d.updatedAt),
      }))

      const wraps = rawWraps.map((d: any) => ({
        _id: d._id?.toString(),
        prefix: d.prefix || "",
        wrap_host: d.wrap_host || "",
        target_host: d.target_host || "",
        createdAt: toMs(d.createdAt),
        updatedAt: toMs(d.updatedAt),
      }))

      const quotas = rawQuotas.map((d: any) => ({
        _id: typeof d._id === "string" ? d._id : d._id?.toString(),
        count: d.count ?? 0,
        date: d.date || "",
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
  } catch (error: any) {
    console.error("[website-manager GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

const CACHE_KEY = "dashboard_stats_data"
const CACHE_TTL = 300 // 5 minutes cache

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const force = searchParams.get("force") === "true"

  try {
    let payload = force ? null : await redis.get(CACHE_KEY)

    if (!payload) {
      const db = await getDb()

      // Calculate threshold for 15 days ago for quotas
      const thresholdDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")

      const [
        totalPages,
        activeBlogs,
        totalAds,
        crawlCount,
        newsCount,
        socialCount,
        recentQuotas,
        pageSources,
        blogChannels,
      ] = await Promise.all([
        db.collection("pages").countDocuments(),
        db.collection("blogs").countDocuments({ enabled: true }),
        db.collection("ads").countDocuments(),
        db.collection("crawl-queue").countDocuments(),
        db.collection("news_queue").countDocuments(),
        db.collection("social_queue").countDocuments(),
        db
          .collection("quotas")
          .find({ date: { $gte: thresholdDate } })
          .sort({ date: 1 })
          .toArray(),
        db
          .collection("pages")
          .aggregate([{ $group: { _id: "$source", count: { $sum: 1 } } }])
          .toArray(),
        db
          .collection("blogs")
          .aggregate([{ $group: { _id: "$channel", count: { $sum: 1 } } }])
          .toArray(),
      ])

      // Format quota distribution for the chart
      // Grouping by date and totaling the count
      interface QuotaItem { name: string; total: number }
      const quotaChartData = (recentQuotas as unknown as { date: string; count: number }[]).reduce((acc: QuotaItem[], curr: { date: string; count: number }) => {
        const dateStr = curr.date // e.g. "20260331"
        const formattedDate = `${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
        const existing = acc.find((item) => item.name === formattedDate)
        if (existing) {
          existing.total += curr.count || 0
        } else {
          acc.push({ name: formattedDate, total: (curr.count as number) || 0 })
        }
        return acc
      }, [] as QuotaItem[])

      payload = {
        summary: {
          totalPages,
          activeBlogs,
          totalAds,
          queueBacklog: crawlCount + newsCount + socialCount,
        },
        queues: {
          crawl: crawlCount,
          news: newsCount,
          social: socialCount,
        },
        sources: pageSources.map((s) => ({ name: s._id || "Other", count: s.count })),
        channels: blogChannels.map((c) => ({ name: c._id || "Other", count: c.count })),
        chartData: quotaChartData,
        fetchedAt: Date.now(),
      }

      await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL })
    }

    return NextResponse.json(payload)
  } catch (error: unknown) {
    console.error("[DASHBOARD_STATS_ERROR]", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

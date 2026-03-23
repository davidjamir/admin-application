import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const force = searchParams.get("force") === "true"
  const cacheKey = "queues_data_master_v2" // Versioned cache key

  try {
    let payload: any = force ? null : await redis.get(cacheKey)

    if (!payload) {
      console.log("[QUEUES API] Fetching fresh data from MongoDB...")
      const db = await getDb()
      
      // Fetch data for listing
      const [crawlQueue, newsQueue, socialQueue] = await Promise.all([
        db.collection("crawl-queue").find({}).sort({ failCount: 1, createdAt: -1 }).limit(50).toArray(),
        db.collection("news_queue").find({}).sort({ createdAt: -1 }).limit(50).toArray(),
        db.collection("social_queue").find({}).toArray() // Fetch all for complex sorting
      ])

      // Fetch statistics
      const [crawlStats, newsTotal, socialStats] = await Promise.all([
        db.collection("crawl-queue").aggregate([
          { $group: { _id: "$type", count: { $sum: 1 }, totalFails: { $sum: "$failCount" } } }
        ]).toArray(),
        db.collection("news_queue").countDocuments(),
        db.collection("social_queue").aggregate([
          { $group: { _id: "$page", count: { $sum: 1 } } }
        ]).toArray()
      ])

      const mapDoc = (doc: any) => {
        const getTimestamp = (val: any) => {
          if (!val) return Date.now();
          if (typeof val === 'number') return val;
          if (val.$date) return new Date(val.$date).getTime();
          return new Date(val).getTime();
        };

        return {
          ...doc,
          _id: doc._id?.toString(),
          createdAt: new Date(getTimestamp(doc.createdAt)).toISOString(),
          itemId: String(doc.itemId || "N/A"),
        };
      };

      const now = Date.now();
      
      // Process Social Queue with custom sorting:
      // 1. Valid future schedules (Ascending)
      // 2. Overdue/Failed (Bottom)
      const processedSocial = socialQueue.map(item => {
        const mapped = mapDoc(item);
        const scheduleAtVal = item.scheduleAt || item.createdAt;
        let scheduleAtMs = now;
        if (typeof scheduleAtVal === 'number') scheduleAtMs = scheduleAtVal;
        else if (scheduleAtVal?.$date) scheduleAtMs = new Date(scheduleAtVal.$date).getTime();
        else if (scheduleAtVal) scheduleAtMs = new Date(scheduleAtVal).getTime();
        
        return { ...mapped, page: item.page || "Unknown", scheduleAt: scheduleAtMs };
      }).sort((a, b) => {
        const isAError = a.scheduleAt < now;
        const isBError = b.scheduleAt < now;
        
        if (isAError && !isBError) return 1;
        if (!isAError && isBError) return -1;
        
        return a.scheduleAt - b.scheduleAt;
      }).slice(0, 50);

      payload = {
        crawlQueue: crawlQueue.map(item => ({
          ...mapDoc(item),
          type: item.type || "news",
          failCount: Number(item.failCount || 0)
        })),
        newsQueue: newsQueue.map(mapDoc),
        socialQueue: processedSocial,
        stats: {
          crawl: {
            total: crawlStats.reduce((acc, curr) => acc + curr.count, 0),
            types: crawlStats.reduce((acc, curr) => ({ ...acc, [curr._id || 'unknown']: curr.count }), {}),
            fails: crawlStats.reduce((acc, curr) => acc + (curr.totalFails || 0), 0)
          },
          news: {
            total: newsTotal
          },
          social: {
            total: socialStats.reduce((acc, curr) => acc + curr.count, 0),
            pages: socialStats.length
          }
        },
        fetchedAt: now
      }

      await redis.set(cacheKey, payload, { ex: 60 })
    }

    return NextResponse.json(payload)
  } catch (error: any) {
    console.error("Queues API Error:", error)
    return NextResponse.json({ error: "Failed to load queues", details: error.message }, { status: 500 })
  }
}

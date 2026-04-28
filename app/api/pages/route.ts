import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoryFilter = searchParams.get("category")
  const searchFilter = searchParams.get("search")

  try {
    const cacheKey = "pages_list_master"
    const forceRecrawl = searchParams.get("forceRecrawl") === "true"
    
    // 1. Try fetching from Redis first unless force recrawl requested
    let cacheWrapper: { data: Record<string, unknown>[]; timestamp: number } | null = null
    if (!forceRecrawl) {
      cacheWrapper = await redis.get(cacheKey)
    }
    
    let rawData: Record<string, unknown>[] = []
    let fetchedAt: number = 0

    // 2. Cache MISS or FORCE RECRAWL: Fetch from MongoDB
    if (!cacheWrapper) {
      console.log("[DATA FETCH] Fetching directly from MongoDB" + (forceRecrawl ? " (Force Recrawl)..." : "..."))
      const db = await getDb()
      const pagesCollection = db.collection("pages")
      
      const documents = await pagesCollection.find({}).toArray()
      
      // Parallel fetch queue counts from social_queue collection for each page
      const queueCounts = await Promise.all(
        documents.map(doc => 
          db.collection("social_queue").countDocuments({ 
            page: doc.name as string,
            scheduleAt: { $gte: Date.now() - 3600000 } // Đang chờ hoặc vừa đăng xoay vòng gần đây
          }).catch(() => 0) 
        )
      )
      
      interface MongoDoc {
        _id?: { toString(): string };
        name?: string;
        createdAt?: Date | { $date: string };
        updatedAt?: Date | { $date: string };
        lastScheduledAt?: number;
        lastScheduledViralAt?: number;
        lastActionAt?: number;
        contentPreview?: string;
        category?: string;
      }
      
      // Map MongoDB BSON structure into standard UI payload
      rawData = (documents as MongoDoc[]).map((doc, index) => {
        const toISO = (d: Date | { $date: string } | undefined) => {
          if (!d) return new Date(0).toISOString();
          if (d instanceof Date) return d.toISOString();
          return d.$date;
        };

        return {
          ...doc,
          _id: { $oid: doc._id?.toString() || "" }, // Defensive mapping for ObjectId
          createdAt: { $date: toISO(doc.createdAt) },
          updatedAt: { $date: toISO(doc.updatedAt) },
          lastScheduledAt: doc.lastScheduledAt || Date.now() - 31536000000, 
          lastScheduledViralAt: doc.lastScheduledViralAt || Date.now() - 31536000000,
          lastActionAt: doc.lastActionAt || Date.now() - 31536000000,
          contentPreview: doc.contentPreview || "Sẵn sàng phân phối nội dung...",
          queueCount: queueCounts[index] || 0
        };
      }) as Record<string, unknown>[]

      fetchedAt = Date.now()
      cacheWrapper = { data: rawData, timestamp: fetchedAt }

      // Cache the heavy wrapper payload with 2-Hour TTL (7200 seconds)
      await redis.set(cacheKey, cacheWrapper, { ex: 7200 })
    } else {
      console.log("[CACHE HIT] Serving from Upstash Redis ⚡")
      rawData = cacheWrapper.data
      fetchedAt = cacheWrapper.timestamp
    }

    // Ensure rawData is an Array before filtering
    let filteredData = Array.isArray(rawData) ? [...rawData] : []

    // 3. Apply Filters locally so cache is utilized maximally for all filters
    if (categoryFilter && categoryFilter !== "All") {
      filteredData = filteredData.filter((page) => (page.topic as string) === categoryFilter)
    }

    if (searchFilter) {
      const query = searchFilter.toLowerCase()
      filteredData = filteredData.filter((page) =>
        (page?.name as string | undefined)?.toLowerCase().includes(query) ||
        (page?.category as string | undefined)?.toLowerCase().includes(query) ||
        (page?.topic as string | undefined)?.toLowerCase().includes(query)
      )
    }

    // 4. Sort correctly based on Health curve timing
    filteredData.sort((a, b) => {
      const aLatest = Math.max((a.lastScheduledAt as number) || 0, (a.lastScheduledViralAt as number) || 0)
      const bLatest = Math.max((b.lastScheduledAt as number) || 0, (b.lastScheduledViralAt as number) || 0)
      return bLatest - aLatest
    })

    return NextResponse.json({
      data: filteredData,
      total: filteredData.length,
      fetchedAt
    })

  } catch (error: unknown) {
    console.error("Critical System Error [MongoDB/Redis]:", error)
    // Fallback graceful degradation
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ 
      error: "Internal Server System Failure", 
      message
    }, { status: 500 })
  }
}

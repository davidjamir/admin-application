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
    let cacheWrapper: any = null
    if (!forceRecrawl) {
      cacheWrapper = await redis.get(cacheKey)
    }
    
    let rawData: any[] = []
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
            page: doc.name,
            scheduleAt: { $gte: Date.now() - 3600000 } // Đang chờ hoặc vừa đăng xoay vòng gần đây
          }).catch(() => 0) 
        )
      )
      
      // Map MongoDB BSON structure into standard UI payload
      rawData = documents.map((doc, index) => ({
        ...doc,
        _id: { $oid: doc._id?.toString() || "" }, // Defensive mapping for ObjectId
        createdAt: doc.createdAt?.$date ? doc.createdAt : { $date: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date(0).toISOString() },
        updatedAt: doc.updatedAt?.$date ? doc.updatedAt : { $date: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date(0).toISOString() },
        lastScheduledAt: doc.lastScheduledAt || Date.now() - 31536000000, 
        lastActionAt: doc.lastActionAt || Date.now() - 31536000000,
        contentPreview: doc.contentPreview || "Sẵn sàng phân phối nội dung...",
        queueCount: queueCounts[index] || 0
      }))

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
      filteredData = filteredData.filter((page) => page.category === categoryFilter)
    }

    if (searchFilter) {
      filteredData = filteredData.filter((page) =>
        page?.name?.toLowerCase().includes(searchFilter.toLowerCase())
      )
    }

    // 4. Sort correctly based on Health curve timing
    filteredData.sort((a, b) => (b.lastScheduledAt || 0) - (a.lastScheduledAt || 0))

    return NextResponse.json({
      data: filteredData,
      total: filteredData.length,
      fetchedAt
    })

  } catch (error: any) {
    console.error("Critical System Error [MongoDB/Redis]:", error)
    // Fallback graceful degradation
    return NextResponse.json({ 
      error: "Internal Server System Failure", 
      message: String(error)
    }, { status: 500 })
  }
}

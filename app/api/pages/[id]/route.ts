import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"
import { ObjectId } from "mongodb"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params object (Next.js 15 required change)
  const resolvedParams = await params
  const pageId = resolvedParams.id
  
  const { searchParams } = new URL(request.url)
  const force = searchParams.get("force") === "true"

  const cacheKey = `page_details_${pageId}`

  try {
    let payload: Record<string, unknown> | null = force ? null : await redis.get(cacheKey)

    if (!payload) {
      const db = await getDb()
      const pagesCollection = db.collection("pages")
      
      let doc;
      try {
        doc = await pagesCollection.findOne({ _id: new ObjectId(pageId) })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        doc = await pagesCollection.findOne({ pageId: pageId })
      }

      if (!doc) {
         // Return mock fallback for empty dev DBs
          payload = {
            _id: pageId,
            stats: { 
              today: 0, 
              tomorrow: 0, 
              later: 0 
            },
            queue: [],
            history: [],
            cachedAt: Date.now()
          }
      } else {
        // Cập nhật Query dựa trên cấu trúc thật sự của collection social_queue do user gửi:
        // document lưu reference thông qua trường string "page" (chứa tên của thẻ page).
        const queueCollection = db.collection("social_queue")
        const rawQueue = await queueCollection.find({
          page: doc.name as string
        }).sort({ scheduleAt: 1 }).limit(50).toArray()

        const mappedQueue = rawQueue.map((item) => ({
          id: (item._id as { toString(): string })?.toString() || (item.itemId as string) || Math.random().toString(),
          content: `ItemID: ${(item.itemId as string) || "N/A"}`,
          scheduledAt: typeof item.scheduleAt === 'number' 
            ? item.scheduleAt 
            : new Date((item.scheduleAt as string | number | Date) || (item.createdAt as string | number | Date) || Date.now()).getTime(),
          status: "PENDING"
        }))

        const getHCMDateStr = (ts: number) => {
          return new Date(ts).toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
        }
        const nowMs = Date.now()
        const todayStr = getHCMDateStr(nowMs)
        const tomorrowStr = getHCMDateStr(nowMs + 86400000)

        let countToday = 0
        let countTomorrow = 0
        let countLater = 0

        mappedQueue.forEach((qItem) => {
          const t = qItem.scheduledAt
          if (t >= nowMs) {
            const dStr = getHCMDateStr(t)
            if (dStr === todayStr) countToday++
            else if (dStr === tomorrowStr) countTomorrow++
            else countLater++
          }
        })

        payload = {
          _id: doc._id.toString(),
          stats: { today: countToday, tomorrow: countTomorrow, later: countLater },
          queue: mappedQueue,
          history: doc.history || [],
          cachedAt: Date.now()
        }
      }
      
      await redis.set(cacheKey, payload, { ex: 7200 }) // 2h cache
    }

    return NextResponse.json(payload)
  } catch(error: unknown) {
    console.error("Page Details DB Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

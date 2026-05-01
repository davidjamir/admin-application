import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: pageId, itemId } = await params

  try {
    const db = await getDb()
    const pagesCollection = db.collection("pages")

    let pageDoc = null
    if (ObjectId.isValid(pageId)) {
      pageDoc = await pagesCollection.findOne({ _id: new ObjectId(pageId) })
    }

    if (!pageDoc) {
      pageDoc = await pagesCollection.findOne({ pageId })
    }

    if (!pageDoc?.name) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    const queueCollection = db.collection("social_queue")
    const result = ObjectId.isValid(itemId)
      ? await queueCollection.deleteOne({ _id: new ObjectId(itemId), page: pageDoc.name as string })
      : await queueCollection.deleteOne({ itemId, page: pageDoc.name as string })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Queue item not found" }, { status: 404 })
    }

    await Promise.all([
      redis.del(`page_details_${pageId}`),
      redis.del("pages_list_master"),
      redis.del("queues_data_master_v2"),
      redis.del("dashboard_stats_data"),
    ])

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("Page Queue Item Delete Error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

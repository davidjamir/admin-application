import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getSocialItemsDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

const SOCIAL_COLL = process.env.MONGODB_SOCIAL_COLLECTION?.trim() || "social"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 })
    }

    const socialDb = await getSocialItemsDb()
    const coll = socialDb.collection(SOCIAL_COLL)
    const result = await coll.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 })
    }

    await Promise.all([
      redis.del("pages_list_master"),
      redis.del("queues_data_master_v2"),
      redis.del("dashboard_stats_data"),
    ])

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error("[content-publisher DELETE]", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

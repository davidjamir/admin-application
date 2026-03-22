import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

const CACHE_KEY = "ad_creatives_list"
const CACHE_TTL = 7200 // 2 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const force = searchParams.get("force") === "true"

  try {
    let payload: any = force ? null : await redis.get(CACHE_KEY)

    if (!payload) {
      const db = await getDb()
      const ads = await db.collection("ads").find({}).sort({ createdAt: -1 }).toArray()

      const mapped = ads.map((ad: any) => ({
        _id: ad._id?.toString(),
        source: ad.source || "unknown",
        domain: ad.domain || "",
        origin: ad.origin || "",
        name: ad.name || "Untitled",
        content: ad.content || "",
        count: ad.count ?? 0,
        enabled: ad.enabled ?? true,
        note: ad.note || "",
        priority: ad.priority ?? 0,
        createdAt: ad.createdAt?.$date
          ? new Date(ad.createdAt.$date).getTime()
          : ad.createdAt instanceof Date
            ? ad.createdAt.getTime()
            : typeof ad.createdAt === "number" ? ad.createdAt : Date.now(),
        updatedAt: ad.updatedAt?.$date
          ? new Date(ad.updatedAt.$date).getTime()
          : ad.updatedAt instanceof Date
            ? ad.updatedAt.getTime()
            : typeof ad.updatedAt === "number" ? ad.updatedAt : Date.now(),
      }))

      payload = { items: mapped, fetchedAt: Date.now() }
      await redis.set(CACHE_KEY, payload, { ex: CACHE_TTL })
    }

    return NextResponse.json(payload)
  } catch (error: any) {
    console.error("[ad-creatives GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const db = await getDb()

    const now = new Date()
    const doc = {
      source: body.source || "manual",
      domain: body.domain || "",
      origin: body.origin || "",
      name: body.name || "Untitled",
      content: body.content || "",
      count: 0,
      enabled: body.enabled ?? true,
      note: body.note || "",
      priority: Number(body.priority) || 0,
      createdAt: now,
      updatedAt: now,
    }

    const result = await db.collection("ads").insertOne(doc)
    await redis.del(CACHE_KEY)

    return NextResponse.json({ success: true, _id: result.insertedId.toString() }, { status: 201 })
  } catch (error: any) {
    console.error("[ad-creatives POST]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { _id, ...fields } = body
    if (!_id) return NextResponse.json({ error: "Missing _id" }, { status: 400 })

    const { ObjectId } = await import("mongodb")
    const db = await getDb()

    const update = {
      ...(fields.name      !== undefined && { name:     fields.name     }),
      ...(fields.source    !== undefined && { source:   fields.source   }),
      ...(fields.domain    !== undefined && { domain:   fields.domain   }),
      ...(fields.origin    !== undefined && { origin:   fields.origin   }),
      ...(fields.name      !== undefined && { name:     fields.name     }),
      ...(fields.note      !== undefined && { note:     fields.note     }),
      ...(fields.priority  !== undefined && { priority: Number(fields.priority) }),
      ...(fields.enabled   !== undefined && { enabled:  fields.enabled  }),
      updatedAt: new Date(),
    }

    await db.collection("ads").updateOne({ _id: new ObjectId(_id) }, { $set: update })
    await redis.del(CACHE_KEY)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[ad-creatives PATCH]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

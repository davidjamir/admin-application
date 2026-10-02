import { NextResponse } from "next/server"
import { getOriginsCollection } from "@/lib/origins-db"
import { serializeOriginListItem } from "@/lib/origin-serialize"

export async function GET() {
  try {
    const origins = await getOriginsCollection()
    const docs = await origins
      .find(
        {},
        {
          projection: {
            origin: 1,
            totalItems: 1,
            updatedAt: 1,
            icon: 1,
            "config.enabledAds": 1,
          },
        },
      )
      .sort({ origin: 1 })
      .toArray()

    return NextResponse.json({
      items: docs.map((doc) => serializeOriginListItem(doc as Record<string, unknown>)),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[ORIGINS_LIST]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

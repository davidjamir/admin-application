import { NextResponse } from "next/server"
import { getOriginsCollection } from "@/lib/origins-db"

export async function GET() {
  try {
    const originsCollection = await getOriginsCollection()
    const docs = await originsCollection
      .find(
        {},
        {
          projection: {
            origin: 1,
            totalItems: 1,
            icon: 1,
          },
        },
      )
      .sort({ origin: 1 })
      .toArray()

    const origins = docs
      .map((d) => ({
        origin: typeof d.origin === "string" ? d.origin.trim() : "",
        totalItems: typeof d.totalItems === "number" ? d.totalItems : undefined,
        icon: typeof d.icon === "string" ? d.icon : undefined,
      }))
      .filter((d) => d.origin && d.origin.includes("."))

    return NextResponse.json({
      success: true,
      total: origins.length,
      origins,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[R2_SYNC_ORIGINS_ERROR]", error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

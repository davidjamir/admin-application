import { NextResponse } from "next/server"
import { getSitesCollection } from "@/lib/origins-db"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const origin = searchParams.get("origin")?.trim()

  if (!origin) {
    return NextResponse.json(
      { success: false, error: "Query parameter 'origin' is required" },
      { status: 400 },
    )
  }

  try {
    const cleanOrigin = origin.trim()
    const originRegex = new RegExp(
      `^${cleanOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      "i",
    )

    const sitesCollection = await getSitesCollection()
    const docs = await sitesCollection
      .find(
        { origin: originRegex },
        {
          projection: {
            domain: 1,
          },
        },
      )
      .toArray()

    const domainSet = new Set<string>()
    for (const doc of docs) {
      if (typeof doc.domain === "string" && doc.domain.trim()) {
        domainSet.add(doc.domain.trim())
      }
    }

    const domains = Array.from(domainSet).sort((a, b) => a.localeCompare(b))

    return NextResponse.json({
      success: true,
      origin,
      total: domains.length,
      domains,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[R2_SYNC_DOMAINS_ERROR]", error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

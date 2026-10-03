import { NextResponse } from "next/server"
import { getSitesCollection } from "@/lib/origins-db"

export interface OriginSiteGroup {
  origin: string
  domains: string[]
}

export async function GET() {
  try {
    const sitesCollection = await getSitesCollection()
    const sites = await sitesCollection
      .find(
        {},
        {
          projection: {
            origin: 1,
            domain: 1,
          },
        },
      )
      .toArray()

    // Group domains by origin
    const originMap = new Map<string, Set<string>>()

    for (const site of sites) {
      const origin = typeof site.origin === "string" ? site.origin.trim() : ""
      const domain = typeof site.domain === "string" ? site.domain.trim() : ""

      if (!origin || !origin.includes(".")) continue

      if (!originMap.has(origin)) {
        originMap.set(origin, new Set())
      }

      if (domain) {
        originMap.get(origin)!.add(domain)
      }
    }

    const result: OriginSiteGroup[] = Array.from(originMap.entries())
      .map(([origin, domainsSet]) => ({
        origin,
        domains: Array.from(domainsSet).sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => a.origin.localeCompare(b.origin))

    return NextResponse.json({
      success: true,
      totalOrigins: result.length,
      origins: result,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[R2_SYNC_SITES_ERROR]", error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

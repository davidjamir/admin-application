import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const force = searchParams.get("force") === "true"
  const resolvedParams = await params
  const businessId = resolvedParams.id

  if (!token || !businessId) {
    return NextResponse.json({ error: "Token and Business ID are required" }, { status: 400 })
  }

  try {
    const cacheKey = `fb_business_counts_${businessId}_${token.slice(-10)}`

    if (!force) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log(`[CACHE HIT] Counts for Business ${businessId}`)
        return NextResponse.json(cached)
      }
    }

    console.log(`[CACHE MISS] Fetching counts for Business ${businessId}...`)

    // Get counts for owned_pages, client_pages, and applications in parallel
    const [ownedRes, clientRes, appsRes] = await Promise.all([
      fetch(
        `https://graph.facebook.com/${businessId}/owned_pages?access_token=${token}&summary=true&limit=0`
      ),
      fetch(
        `https://graph.facebook.com/${businessId}/client_pages?access_token=${token}&summary=true&limit=0`
      ),
      fetch(
        `https://graph.facebook.com/${businessId}/applications?access_token=${token}&summary=true&limit=0`
      ),
    ])

    const [ownedData, clientData, appsData] = await Promise.all([
      ownedRes.json(),
      clientRes.json(),
      appsRes.json(),
    ])

    interface FacebookSummaryResponse {
      summary?: {
        total_count?: number
      }
      error?: { message: string }
    }

    const errorResponse = (ownedData as { error?: { message: string } }).error || 
                          (clientData as { error?: { message: string } }).error || 
                          (appsData as { error?: { message: string } }).error

    if (errorResponse) {
      throw new Error(errorResponse.message || "Failed to fetch counts from Facebook")
    }

    const ownedCount = (ownedData as FacebookSummaryResponse).summary?.total_count || 0
    const clientCount = (clientData as FacebookSummaryResponse).summary?.total_count || 0
    const appsCount = (appsData as FacebookSummaryResponse).summary?.total_count || 0

    const payload = {
      pages: ownedCount + clientCount,
      apps: appsCount,
      fetchedAt: Date.now()
    }

    // Cache counts for 24 hours
    await redis.set(cacheKey, payload, { ex: 86400 })

    return NextResponse.json(payload)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Facebook Business Counts API Error (${businessId}):`, error)
    return NextResponse.json({ error: message || "Failed to fetch counts" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

const LIMIT = 200

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const force = searchParams.get("force") === "true"

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  try {
    // Generate a cache key based on the token segment for uniqueness/security
    const cacheKey = `fb_assets_discovery_${token.slice(-10)}`

    if (!force) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log(`[CACHE HIT] Discovery for token segment ...${token.slice(-10)}`)
        return NextResponse.json(cached)
      }
    }

    console.log(`[CACHE MISS] Discovery: Fetching Businesses and Pages...`)

    // 1. Fetch Businesses
    const bizUrl = new URL("https://graph.facebook.com/me/businesses")
    bizUrl.searchParams.set("fields", "id,name,permitted_roles")
    bizUrl.searchParams.set("access_token", token)
    bizUrl.searchParams.set("limit", LIMIT.toString())

    // 2. Fetch All Pages accessible to account
    const pagesUrl = new URL("https://graph.facebook.com/me/accounts")
    pagesUrl.searchParams.set("fields", "id,name,access_token,category")
    pagesUrl.searchParams.set("access_token", token)
    pagesUrl.searchParams.set("limit", LIMIT.toString())

    const [bizRes, pagesRes] = await Promise.all([
      fetch(bizUrl.toString()),
      fetch(pagesUrl.toString())
    ])

    const bizData = bizRes.ok ? await bizRes.json() : { data: [] }
    const pagesData = pagesRes.ok ? await pagesRes.json() : { data: [] }

    if (bizData.error) console.warn("Discovery: Businesses fetch error:", bizData.error.message)
    if (pagesData.error) console.warn("Discovery: Pages fetch error:", pagesData.error.message)

    const payload = {
      businesses: bizData.data || [],
      allPages: pagesData.data || [],
      fetchedAt: Date.now()
    }

    // Cache for 1 hour
    await redis.set(cacheKey, payload, { ex: 3600 })

    return NextResponse.json(payload)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Facebook Discovery API Error:", error)
    return NextResponse.json({ error: message || "Failed to discover assets" }, { status: 500 })
  }
}

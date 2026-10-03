import { NextResponse } from "next/server"

export const maxDuration = 60 // 60 seconds timeout for Vercel/Next.js functions

interface SyncFlags {
  siteconfig?: boolean
  adstxt?: boolean
  sitemapgeneral?: boolean
  sitemappage?: boolean
  sitemapcategory?: boolean
  robotstxt?: boolean
  feedpost?: boolean
  latestpost?: boolean
}

interface TriggerRequestBody extends SyncFlags {
  origin: string
  domain?: string
  domains?: string[]
}

const DEFAULT_BASE_URL =
  process.env.ADAPTER_SYNC_URL?.trim() || "https://adapter1.vercel.app/api/async-site"

async function executeSingleSync(
  origin: string,
  domain: string | undefined,
  flags: SyncFlags,
) {
  const url = new URL(DEFAULT_BASE_URL)
  url.searchParams.set("origin", origin)

  if (domain && domain.trim().length > 0) {
    url.searchParams.set("domain", domain.trim())
  }

  // Set flags as query parameters
  const flagKeys: (keyof SyncFlags)[] = [
    "siteconfig",
    "adstxt",
    "sitemapgeneral",
    "sitemappage",
    "sitemapcategory",
    "robotstxt",
    "feedpost",
    "latestpost",
  ]

  for (const key of flagKeys) {
    if (flags[key] !== undefined) {
      url.searchParams.set(key, flags[key] ? "true" : "false")
    }
  }

  const startTime = Date.now()
  const targetUrl = url.toString()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000) // 45s timeout

    const secret = process.env.CONTENT_PUBLISHER_SCHEDULE_CRON_SECRET?.trim() ?? ""

    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/json, text/plain, */*",
        "User-Agent": "AdminApplication-R2Sync/1.0",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const durationMs = Date.now() - startTime
    const text = await response.text()

    let parsedData: unknown = text
    try {
      parsedData = JSON.parse(text)
    } catch {
      // Return raw text if not json
    }

    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      targetUrl,
      data: parsedData,
    }
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime
    const message = error instanceof Error ? error.message : "Network error"
    return {
      success: false,
      status: 0,
      statusText: message,
      durationMs,
      targetUrl,
      error: message,
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TriggerRequestBody
    const { origin, domain, domains, ...flags } = body

    if (!origin || typeof origin !== "string" || !origin.trim()) {
      return NextResponse.json(
        { success: false, error: "Origin is required" },
        { status: 400 },
      )
    }

    const cleanOrigin = origin.trim()

    // Case 1: Batch sync multiple domains
    if (Array.isArray(domains) && domains.length > 0) {
      const results = []
      for (const d of domains) {
        const res = await executeSingleSync(cleanOrigin, d, flags)
        results.push({ domain: d, ...res })
      }

      const allSuccess = results.every((r) => r.success)
      return NextResponse.json({
        success: allSuccess,
        isBatch: true,
        origin: cleanOrigin,
        results,
      })
    }

    // Case 2: Single domain or origin-only sync
    const res = await executeSingleSync(cleanOrigin, domain, flags)
    return NextResponse.json(res, { status: res.success ? 200 : 502 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal error"
    console.error("[R2_TRIGGER_ERROR]", error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

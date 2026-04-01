import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { FacebookPage } from "@/types/facebook"

const LIMIT = 200

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
    const cacheKey = `fb_business_details_${businessId}_${token.slice(-10)}`

    if (!force) {
      const cached = await redis.get(cacheKey)
      if (cached) {
        console.log(`[CACHE HIT] Details for Business ${businessId}`)
        return NextResponse.json(cached)
      }
    }

    console.log(`[CACHE MISS] Fetching details for Business ${businessId}...`)

    const appFields = "id,name,link,category"
    const pageFields = "id,name,category,access_token"
    const bmFields = 'id,name,verification_status,permitted_roles,is_promotable,sharing_eligibility_status,can_create_ad_accounts,created_time,primary_page,timezone_id,vertical,extendedcredits,owned_ad_accounts.limit(100){id,name,account_status,currency},adspixels.limit(100){id,name},whatsapp_business_accounts.limit(100){id,name,status}';

    // Step 1: Prepare Batch Requests
    const batchRequests: { method: string; relative_url: string; name?: string }[] = [
      { method: "GET", relative_url: `v25.0/${businessId}?fields=${bmFields}`, name: "details" },
      { method: "GET", relative_url: `v25.0/${businessId}/owned_pages?fields=${pageFields}&limit=${LIMIT}`, name: "owned_pages" },
      { method: "GET", relative_url: `v25.0/${businessId}/client_pages?fields=${pageFields}&limit=${LIMIT}`, name: "client_pages" },
      { method: "GET", relative_url: `v25.0/${businessId}/system_users?fields=id,name,role,email`, name: "system_users" },
      { method: "GET", relative_url: `v25.0/${businessId}/business_users?fields=id,name,email,role,status&limit=250`, name: "business_users" },
      { method: "GET", relative_url: `v25.0/${businessId}/owned_apps?fields=${appFields}`, name: "owned_apps" },
      { method: "GET", relative_url: `v25.0/${businessId}/client_apps?fields=${appFields}`, name: "client_apps" },
      { method: "GET", relative_url: `v25.0/${businessId}/pending_client_apps?fields=${appFields}`, name: "pending_apps" },
      { method: "GET", relative_url: `v25.0/${businessId}/business_asset_groups?fields=id,name,contained_pages.limit(500){id,name},contained_applications.limit(500){id,name},contained_ad_accounts.limit(500){id,name}&limit=50`, name: "asset_groups" }
    ]

    // Step 2: Execute Consolidated Batch
    const formData = new URLSearchParams()
    formData.append("access_token", token)
    formData.append("batch", JSON.stringify(batchRequests))

    const response = await fetch("https://graph.facebook.com", {
      method: "POST",
      body: formData
    })

    const results = await response.json()
    if (!response.ok || !Array.isArray(results)) {
      throw new Error(`Batch request failed: ${JSON.stringify(results)}`)
    }

    // Step 3: Parse Results
    interface BatchItem {
      code: number;
      body: string;
    }
    const parse = (item: BatchItem) => (item && item.code === 200) ? JSON.parse(item.body) : { data: [] }
    
    const detailsData = parse(results[0])
    const ownedData = parse(results[1])
    const clientData = parse(results[2])
    const systemUsersData = parse(results[3])
    const businessUsersData = parse(results[4])
    const ownedAppsData = parse(results[5])
    const clientAppsData = parse(results[6])
    const pendingAppsData = parse(results[7])
    const assetGroupsData = parse(results[8])

    // Extract pages from nested asset groups
    interface AssetGroup {
      id: string;
      name: string;
      contained_pages?: { data: { id: string; name: string }[] };
      contained_applications?: { data: { id: string; name: string; category?: string }[] };
    }
    const groups: AssetGroup[] = assetGroupsData.data || []
    const seenGroupPages = new Set()
    const assetGroupPages: FacebookPage[] = groups.flatMap((g: AssetGroup) => 
      (g.contained_pages?.data || []).filter((p: { id: string }) => {
        if (seenGroupPages.has(p.id)) return false
        seenGroupPages.add(p.id)
        return true
      }).map((p: { id: string; name: string }) => ({ ...p, source: 'asset_group' as const }))
    )
    
    // Extract apps from nested asset groups
    const seenGroupApps = new Set()
    const assetGroupApps = groups.flatMap((g: AssetGroup) => 
      (g.contained_applications?.data || []).filter((app: { id: string }) => {
        if (seenGroupApps.has(app.id)) return false
        seenGroupApps.add(app.id)
        return true
      }).map((app) => ({ ...app, source: 'asset_group' as const }))
    )

    // Step 5: Merge and Format Data
    const ownedPages = (ownedData.data || []).map((p: FacebookPage) => ({ ...p, source: 'owned' as const }))
    const clientPages = (clientData.data || []).map((p: FacebookPage) => ({ ...p, source: 'client' as const }))

    const pagesMap = new Map<string, FacebookPage>()
    assetGroupPages.forEach((p: FacebookPage) => pagesMap.set(p.id, p))
    clientPages.forEach((p: FacebookPage) => pagesMap.set(p.id, p))
    ownedPages.forEach((p: FacebookPage) => pagesMap.set(p.id, p))

    const finalPages = Array.from(pagesMap.values())

    const ownedApps = (ownedAppsData.data || []).map((app: { id: string }) => ({ ...app, source: 'owned' as const }))
    const clientApps = (clientAppsData.data || []).map((app: { id: string }) => ({ ...app, source: 'client' as const }))
    const pendingApps = (pendingAppsData.data || []).map((app: { id: string }) => ({ ...app, source: 'pending' as const }))

    // De-duplicate apps using a Map
    const appsMap = new Map<string, { id: string; name?: string; category?: string; source?: string; icon_url?: string }>()
    assetGroupApps.forEach((app: { id: string }) => appsMap.set(app.id, app))
    pendingApps.forEach((app: { id: string }) => appsMap.set(app.id, app))
    clientApps.forEach((app: { id: string }) => appsMap.set(app.id, app))
    ownedApps.forEach((app: { id: string }) => appsMap.set(app.id, app))

    const allApps = Array.from(appsMap.values())

    const payload = {
      ...detailsData,
      pages: finalPages,
      business_users: businessUsersData, // Result from Batch Request (results[4])
      system_users: systemUsersData.data || [],
      currentUser: { id: "", name: "" },
      apps: allApps,
      business_asset_groups: { data: groups },
      fetchedAt: Date.now()
    }

    // Cache for 24 hours
    await redis.set(cacheKey, payload, { ex: 86400 })

    return NextResponse.json(payload)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Facebook Business API Error (${businessId}):`, error)
    return NextResponse.json({ error: message || "Failed to fetch business details" }, { status: 500 })
  }
}

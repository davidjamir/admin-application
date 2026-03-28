import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { facebookAssetGroupService } from "@/services/facebook-asset-group.service"

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

    // 1. Fetch Business Details
    const detailsUrl = new URL(`https://graph.facebook.com/${businessId}`)
    const fields = 'id,name,verification_status,permitted_roles,is_promotable,sharing_eligibility_status,can_create_ad_accounts,created_time,primary_page,timezone_id,vertical,extendedcredits,owned_ad_accounts.limit(100){id,name,account_status,currency},adspixels.limit(100){id,name},whatsapp_business_accounts.limit(100){id,name,status},business_users.limit(100){id,name,email,role}';
    detailsUrl.searchParams.set("fields", fields)
    detailsUrl.searchParams.set("access_token", token)

    // 2. Fetch Owned Pages (This is now redundant as owned_pages are included in the main details request, but keeping for now if needed for separate pagination or specific fields)
    const ownedUrl = new URL(`https://graph.facebook.com/${businessId}/owned_pages`)
    ownedUrl.searchParams.set("fields", "id,name,category,access_token")
    ownedUrl.searchParams.set("access_token", token)
    ownedUrl.searchParams.set("limit", LIMIT.toString())

    // 3. Fetch Client Pages
    const clientUrl = new URL(`https://graph.facebook.com/${businessId}/client_pages`)
    clientUrl.searchParams.set("fields", "id,name,category,access_token")
    clientUrl.searchParams.set("access_token", token)
    clientUrl.searchParams.set("limit", LIMIT.toString())

    const appFields = "id,name,link,category"

    const [detailsRes, ownedRes, clientRes, systemUsersRes, meRes, ownedAppsRes, clientAppsRes, pendingAppsRes, assetGroupsRes] = await Promise.all([
      fetch(detailsUrl.toString()),
      fetch(ownedUrl.toString()),
      fetch(clientUrl.toString()),
      fetch(`https://graph.facebook.com/${businessId}/system_users?fields=id,name,role,email&access_token=${token}`),
      fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`),
      fetch(`https://graph.facebook.com/${businessId}/owned_apps?fields=${appFields}&access_token=${token}`),
      fetch(`https://graph.facebook.com/${businessId}/client_apps?fields=${appFields}&access_token=${token}`),
      fetch(`https://graph.facebook.com/${businessId}/pending_client_apps?fields=${appFields}&access_token=${token}`),
      facebookAssetGroupService.getBusinessAssetGroups(token, businessId)
    ])

    // Fallback for details if full fields fail (e.g. permission error for specific fields)
    let detailsData: { id: string; name: string; error?: { message: string } } & Record<string, unknown>
    if (!detailsRes.ok) {
      console.warn(`[API] Detailed fields failed for BM ${businessId}, trying fallback...`)
      const fallbackUrl = new URL(`https://graph.facebook.com/${businessId}`)
      fallbackUrl.searchParams.set("fields", "id,name") // minimal fields
      fallbackUrl.searchParams.set("access_token", token)
      const fallbackRes = await fetch(fallbackUrl.toString())

      if (!fallbackRes.ok) {
        const errJson = await fallbackRes.json().catch(() => ({ error: { message: "Unknown Graph API error" } }))
        console.error(`[API] Fallback also failed for BM ${businessId}:`, errJson)
        throw new Error(errJson.error?.message || `Fallback failed with status ${fallbackRes.status}`)
      }

      detailsData = await fallbackRes.json()
    } else {
      detailsData = await detailsRes.json().catch(() => ({ error: { message: "Failed to parse details JSON" } }))
    }

    if (detailsData.error) {
      console.error(`[API] Final failure for BM ${businessId}:`, detailsData.error)
      throw new Error(detailsData.error.message)
    }

    // Graceful handling for pages: if fetch fails, return empty list instead of throwing
    const ownedData = ownedRes.ok ? await ownedRes.json().catch(() => ({ data: [] })) : { data: [] }
    const clientData = clientRes.ok ? await clientRes.json().catch(() => ({ data: [] })) : { data: [] }
    const systemUsersData = systemUsersRes.ok ? await systemUsersRes.json().catch(() => ({ data: [] })) : { data: [] }
    const meData = meRes.ok ? await meRes.json().catch(() => ({ id: "", name: "Current User" })) : { id: "", name: "Current User" }

    // Process Apps
    if (!ownedAppsRes.ok) {
      const err = await ownedAppsRes.json().catch(() => ({}));
      console.error(`[API] Failed to fetch owned_apps for BM ${businessId}:`, JSON.stringify(err));
    }
    if (!clientAppsRes.ok) {
      const err = await clientAppsRes.json().catch(() => ({}));
      console.error(`[API] Failed to fetch client_apps for BM ${businessId}:`, JSON.stringify(err));
    }
    if (!pendingAppsRes.ok) {
      const err = await pendingAppsRes.json().catch(() => ({}));
      console.error(`[API] Failed to fetch pending_client_apps for BM ${businessId}:`, JSON.stringify(err));
    }

    const ownedAppsData = ownedAppsRes.ok ? await ownedAppsRes.json().catch(() => ({ data: [] })) : { data: [] }
    const clientAppsData = clientAppsRes.ok ? await clientAppsRes.json().catch(() => ({ data: [] })) : { data: [] }
    const pendingAppsData = pendingAppsRes.ok ? await pendingAppsRes.json().catch(() => ({ data: [] })) : { data: [] }

    const ownedApps = (ownedAppsData.data || []).map((app: { id: string }) => ({ ...app, source: 'owned' }))
    const clientApps = (clientAppsData.data || []).map((app: { id: string }) => ({ ...app, source: 'client' }))
    const pendingApps = (pendingAppsData.data || []).map((app: { id: string }) => ({ ...app, source: 'pending' }))
    const allApps = [...ownedApps, ...clientApps, ...pendingApps]

    const assetGroupsData = assetGroupsRes // This is now an array from the service

    const payload = {
      ...detailsData,
      pages: [...(ownedData.data || []), ...(clientData.data || [])],
      system_users: systemUsersData.data || [],
      currentUser: meData,
      apps: allApps,
      business_asset_groups: { data: Array.isArray(assetGroupsData) ? assetGroupsData : [] },
      fetchedAt: Date.now()
    }

    // Cache for 1 hour
    await redis.set(cacheKey, payload, { ex: 3600 })

    return NextResponse.json(payload)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`Facebook Business API Error (${businessId}):`, error)
    return NextResponse.json({ error: message || "Failed to fetch business details" }, { status: 500 })
  }
}

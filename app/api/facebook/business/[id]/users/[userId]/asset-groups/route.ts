import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: businessId, userId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // FB Graph API endpoint for assigned business asset groups
    // GET https://graph.facebook.com/v25.0/{user_id}/assigned_business_asset_groups
    const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(userId)}/assigned_business_asset_groups`)
    url.searchParams.set("fields", "id,name,contained_pages{id,name},contained_ad_accounts{id,name},contained_applications{id,name}")
    url.searchParams.set("access_token", token)
    url.searchParams.set("limit", "100")

    console.log(`[API] Fetching assigned asset groups for user ${userId} in business ${businessId}...`)
    
    const res = await fetch(url.toString(), {
      method: "GET",
    })
    
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error(`[API] Facebook Error:`, data.error)
      throw new Error(data.error?.message || "Failed to fetch assigned asset groups")
    }

    return NextResponse.json({
      success: true,
      data: data.data || []
    })
  } catch (error) {
    console.error(`[API] GET assigned asset groups error:`, error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}

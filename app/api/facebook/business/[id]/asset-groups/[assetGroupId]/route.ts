import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; assetGroupId: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const section = searchParams.get("section") // 'users', 'assets', or null for all
  if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 })

  try {
    const { assetGroupId } = await params
    
    // Construct fields based on section
    let fields = "id,name"
    if (!section || section === "users") {
      fields += ",assigned_users.limit(200){id,name,email,role,page_roles,adaccount_roles,pixel_roles,offline_conversion_data_set_roles,page_tasks}"
    }
    if (!section || section === "assets") {
      fields += ",contained_pages.limit(200){id,name},contained_ad_accounts.limit(200){id,name,account_id,currency},contained_ads_pixels.limit(200){id,name},contained_applications.limit(200){id,name,category},contained_instagram_accounts.limit(200){id,username,name}"
    }

    const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}`)
    url.searchParams.set("fields", fields)
    url.searchParams.set("access_token", token)

    const response = await fetch(url.toString())
    const data = await response.json()

    if (!response.ok || data.error) {
      throw new Error(data.error?.message || "Failed to fetch asset group details")
    }

    // Step 3: Format data to match expected combined structure
    const combinedData = {
      id: data.id,
      name: data.name,
      assigned_users: data.assigned_users || { data: [] },
      contained_pages: data.contained_pages || { data: [] },
      contained_ad_accounts: data.contained_ad_accounts || { data: [] },
      contained_ads_pixels: data.contained_ads_pixels || { data: [] },
      contained_applications: data.contained_applications || { data: [] },
      contained_instagram_accounts: data.contained_instagram_accounts || { data: [] }
    }

    return NextResponse.json({ success: true, data: combinedData })
  } catch (error) {
    console.error(`[API] Error fetching asset group details:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assetGroupId: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 })

  try {
    const resolvedParams = await params;
    const resolvedId = resolvedParams.id;
    const { assetGroupId } = resolvedParams;
    const body = await request.json()
    const { action, name, userId, role, assetId, type } = body

    // 1. Rename logic
    if (name) {
      const res = await fetch(`https://graph.facebook.com/v25.0/${assetGroupId}?access_token=${token}&name=${encodeURIComponent(name)}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error?.message || "Failed to rename group")
      return NextResponse.json({ success: true, data })
    }

    // 2. Add User logic
    if (action === "add_user" && userId) {
      const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/assigned_users`)
      url.searchParams.set("access_token", token)
      url.searchParams.set("user", userId)
      url.searchParams.set("business", resolvedId)

      // Add granular roles if provided
      const { page_roles, adaccount_roles, pixel_roles, offline_conversion_data_set_roles } = body
      if (page_roles) url.searchParams.set("page_roles", JSON.stringify(page_roles))
      if (adaccount_roles) url.searchParams.set("adaccount_roles", JSON.stringify(adaccount_roles))
      if (pixel_roles) url.searchParams.set("pixel_roles", JSON.stringify(pixel_roles))
      if (offline_conversion_data_set_roles) url.searchParams.set("offline_conversion_data_set_roles", JSON.stringify(offline_conversion_data_set_roles))

      // Fallback to general role if no granular roles provided
      if (!page_roles && !adaccount_roles && !pixel_roles && !offline_conversion_data_set_roles) {
        url.searchParams.set("role", role || "ADVERTISER")
      }

      const res = await fetch(url.toString(), { method: "POST" })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error?.message || "Failed to add user")
      return NextResponse.json({ success: true, data })
    }

    // 3. Add Asset logic
    if (action === "add_asset" && assetId && type) {
      const typeMap: Record<string, string> = {
        "PAGE": "contained_pages",
        "AD_ACCOUNT": "contained_ad_accounts",
        "ADS_PIXEL": "contained_ads_pixels",
        "APPLICATION": "contained_applications"
      }

      const edge = typeMap[type]
      if (!edge) throw new Error("Unsupported asset type")

      const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/${edge}`)
      url.searchParams.set("asset_id", assetId)
      url.searchParams.set("access_token", token)
      url.searchParams.set("business", resolvedId)

      const res = await fetch(url.toString(), { method: "POST" })
      const data = await res.json()
      if (data.error?.message) throw new Error(data.error.message)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: "Invalid action or missing parameters for POST" }, { status: 400 })
  } catch (error) {
    console.error(`[API] POST error:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; assetGroupId: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Token is required" }, { status: 400 })

  try {
    const resolvedParams = await params;
    const resolvedId = resolvedParams.id;
    const { assetGroupId } = resolvedParams;
    const action = searchParams.get("action")
    const userId = searchParams.get("userId")
    const assetId = searchParams.get("assetId")
    const type = searchParams.get("type")

    // 1. Remove User logic
    if (action === "remove_user" && userId) {
      const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/assigned_users`)
      url.searchParams.set("access_token", token)
      url.searchParams.set("user", userId)
      url.searchParams.set("business", resolvedId)

      const res = await fetch(url.toString(), { method: "DELETE" })
      const data = await res.json()
      if (data.error?.message) throw new Error(data.error.message)
      return NextResponse.json({ success: true, data })
    }

    // 2. Remove Asset logic
    if (action === "remove_asset" && assetId && type) {
      const typeMap: Record<string, string> = {
        "PAGE": "contained_pages",
        "AD_ACCOUNT": "contained_ad_accounts",
        "ADS_PIXEL": "contained_ads_pixels",
        "APPLICATION": "contained_applications"
      }

      const edge = typeMap[type]
      if (!edge) throw new Error("Unsupported asset type")

      const url = new URL(`https://graph.facebook.com/v25.0/${assetGroupId}/${edge}`)
      url.searchParams.set("asset_id", assetId)
      url.searchParams.set("access_token", token)
      url.searchParams.set("business", resolvedId)

      const res = await fetch(url.toString(), { method: "DELETE" })
      const data = await res.json()
      if (data.error?.message) throw new Error(data.error.message)
      return NextResponse.json({ success: true, data })
    }

    // 3. Delete whole group (if no action provided)
    if (!action) {
      const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}`)
      url.searchParams.set("access_token", token)

      const res = await fetch(url.toString(), { method: "DELETE" })
      const data = await res.json()
      if (data.error?.message) throw new Error(data.error.message)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: "Invalid action or missing parameters for DELETE" }, { status: 400 })
  } catch (error) {
    console.error(`[API] DELETE error:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}


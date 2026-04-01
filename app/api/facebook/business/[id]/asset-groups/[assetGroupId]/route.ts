import { NextResponse } from "next/server"
import { getRolesByMode } from "@/lib/facebook-permissions"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; assetGroupId: string }> }
) {
  try {
    const { id: businessId, assetGroupId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const section = searchParams.get("section") || "all"

    const assetEndpoints = [
      { key: "assigned_users", endpoint: "assigned_users", fields: "id,name,page_roles,page_tasks,adaccount_roles,pixel_roles,offline_conversion_data_set_roles,instagram_roles,app_roles", extraParams: `&business=${businessId}` },
      { key: "contained_pages", endpoint: "contained_pages", fields: "id,name" },
      { key: "contained_ad_accounts", endpoint: "contained_ad_accounts", fields: "id,name,account_id,currency" },
      { key: "contained_ads_pixels", endpoint: "contained_ads_pixels", fields: "id,name" },
      { key: "contained_applications", endpoint: "contained_applications", fields: "id,name,category" },
      { key: "contained_instagram_accounts", endpoint: "contained_instagram_accounts", fields: "id,username,name" },
      { key: "contained_offline_conversion_data_sets", endpoint: "contained_offline_conversion_data_sets", fields: "id,name" },
    ]

    // Determine which endpoints to fetch based on section
    let requestedEndpoints = assetEndpoints
    if (section === "users") {
      requestedEndpoints = [assetEndpoints[0]]
    } else if (section === "assets") {
      requestedEndpoints = assetEndpoints.slice(1)
    } else if (section !== "all" && section) {
      // Check if it's a specific key (e.g. contained_pages)
      const specific = assetEndpoints.find(e => e.key === section)
      if (specific) {
        requestedEndpoints = [specific]
      }
    }

    // Construct Batch API request
    const batch = requestedEndpoints.map(({ endpoint, fields, extraParams = "" }) => ({
      method: "GET",
      relative_url: `${assetGroupId}/${endpoint}?fields=${fields}&limit=500${extraParams}`
    }))

    const batchUrl = new URL(`https://graph.facebook.com/v25.0/`)
    const formData = new URLSearchParams()
    formData.set("access_token", token)
    formData.set("batch", JSON.stringify(batch))

    const res = await fetch(batchUrl.toString(), {
      method: "POST",
      body: formData
    })
    
    const batchResults = await res.json()

    if (!res.ok || batchResults.error) {
      throw new Error(batchResults.error?.message || "Failed to execute batch request")
    }

    const amalgamatedData = requestedEndpoints.reduce((acc, { key }, index) => {
      const result = batchResults[index]
      if (result && result.code === 200) {
        try {
          const body = JSON.parse(result.body)
          let data = body.data || []

          if (key === "assigned_users") {
            data = (data || [])
              .filter((item: { id: string; name?: string; role?: string; page_roles?: string[]; page_tasks?: string[]; adaccount_roles?: string[]; pixel_roles?: string[]; offline_conversion_data_set_roles?: string[]; instagram_roles?: string[]; app_roles?: string[] }) => item.id)
              .map((item: { id: string; name?: string; role?: string; page_roles?: string[]; page_tasks?: string[]; adaccount_roles?: string[]; pixel_roles?: string[]; offline_conversion_data_set_roles?: string[]; instagram_roles?: string[]; app_roles?: string[] }) => ({
                id: item.id,
                name: item.name || item.id || "",
                page_roles: item.page_roles,
                page_tasks: item.page_tasks,
                adaccount_roles: item.adaccount_roles,
                pixel_roles: item.pixel_roles,
                offline_conversion_data_set_roles: item.offline_conversion_data_set_roles,
                instagram_roles: item.instagram_roles,
                app_roles: item.app_roles,
              }))
          }
          acc[key] = { data }
        } catch (e) {
          console.error(`Error parsing batch response for ${key}:`, e)
          acc[key] = { data: [] }
        }
      } else {
        console.warn(`Batch sub-request failed for ${key}:`, result)
        acc[key] = { data: [] }
      }
      return acc
    }, {} as Record<string, { data: { id: string; name?: string; role?: string }[] }>)

    return NextResponse.json({
      success: true,
      data: {
        id: assetGroupId,
        ...amalgamatedData
      }
    })
  } catch (error) {
    console.error(`[API] GET error:`, error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assetGroupId: string }> }
) {
  try {
    const { id: businessId, assetGroupId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const body = await request.json()
    const {
      action,
      userId,
      name,
      page_roles,
      adaccount_roles,
      pixel_roles,
      offline_conversion_data_set_roles
    } = body

    // Rename Asset Group
    if (name && !action) {
      const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}`)

      const formData = new URLSearchParams()
      formData.set("name", name)
      formData.set("access_token", token)

      const res = await fetch(url.toString(), {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Failed to rename asset group")
      }
      return NextResponse.json({ success: true, data })
    }

    // Add User to Asset Group
    if (action === "add_user" && userId) {
      const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}/assigned_users`)

      const formData = new URLSearchParams()
      formData.set("business", businessId)
      formData.set("user", userId)
      formData.set("access_token", token)

      // Default to basic page roles if not provided
      const finalPageRoles = page_roles || getRolesByMode("basic")
      formData.set("page_roles", JSON.stringify(finalPageRoles))

      // Add other granular roles if provided in the body
      if (adaccount_roles) formData.set("adaccount_roles", JSON.stringify(adaccount_roles))
      if (pixel_roles) formData.set("pixel_roles", JSON.stringify(pixel_roles))
      if (offline_conversion_data_set_roles) formData.set("offline_conversion_data_set_roles", JSON.stringify(offline_conversion_data_set_roles))

      const res = await fetch(url.toString(), {
        method: "POST",
        body: formData
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Failed to add user")
      }
      return NextResponse.json({ success: true, data })
    }

    // Add Asset to Asset Group
    if (action === "add_asset" && body.assetId && body.type) {
      const edgeMap: Record<string, string> = {
        PAGE: "contained_pages",
        AD_ACCOUNT: "contained_ad_accounts",
        ADS_PIXEL: "contained_ads_pixels",
        APPLICATION: "contained_applications",
        INSTAGRAM_ACCOUNT: "contained_instagram_accounts",
        OFFLINE_CONVERSION_DATA_SET: "contained_offline_conversion_data_sets"
      }

      const edge = edgeMap[body.type as string]
      if (!edge) throw new Error("Unsupported asset type")

      const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}/${edge}`)
      url.searchParams.set("asset_id", body.assetId)
      url.searchParams.set("access_token", token)

      const res = await fetch(url.toString(), { method: "POST" })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error?.message || `Failed to add ${body.type}`)
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error(`[API] POST error:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; assetGroupId: string }> }
) {
  try {
    const { id: businessId, assetGroupId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const action = searchParams.get("action")
    const userId = searchParams.get("userId")

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    // Logic for removing a user from the asset group
    if (action === "remove_user" && userId) {
      const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}/assigned_users`)
      url.searchParams.set("business", businessId)
      url.searchParams.set("user", userId)
      url.searchParams.set("access_token", token)

      const res = await fetch(url.toString(), { method: "DELETE" })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Failed to remove user")
      }
      return NextResponse.json({ success: true, data })
    }

    // Placeholder for other delete actions (e.g., delete_group)
    if (!action) {
      // Delete the whole group
      const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}`)
      url.searchParams.set("access_token", token)
      const res = await fetch(url.toString(), { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error?.message || "Failed to delete asset group")
      return NextResponse.json({ success: true, data })
    }

    // Logic for removing an asset from the asset group
    if (action === "remove_asset") {
      const assetId = searchParams.get("assetId")
      const type = searchParams.get("type")
      
      if (!assetId || !type) throw new Error("Asset ID and type are required")

      const edgeMap: Record<string, string> = {
        PAGE: "contained_pages",
        AD_ACCOUNT: "contained_ad_accounts",
        ADS_PIXEL: "contained_ads_pixels",
        APPLICATION: "contained_applications",
        INSTAGRAM_ACCOUNT: "contained_instagram_accounts",
        OFFLINE_CONVERSION_DATA_SET: "contained_offline_conversion_data_sets"
      }

      const edge = edgeMap[type]
      if (!edge) throw new Error("Unsupported asset type")

      const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(assetGroupId)}/${edge}`)
      url.searchParams.set("asset_id", assetId)
      url.searchParams.set("access_token", token)

      const res = await fetch(url.toString(), { method: "DELETE" })
      const data = await res.json()

      if (!res.ok || data.error) {
        throw new Error(data.error?.message || "Failed to remove asset")
      }
      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error(`[API] DELETE error:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

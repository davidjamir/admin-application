import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const adminToken = req.nextUrl.searchParams.get("token")
  if (!adminToken) {
    return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
  }

  const { id: businessId, appId } = await params

  try {
    // Approach 1: Direct edge /{appId}/assigned_users
    const url = `https://graph.facebook.com/v25.0/${appId}/assigned_users?business=${businessId}&access_token=${adminToken}&fields=id,name,tasks,user_type`
    
    console.log(`[app_assigned_users] GET: ${url.replace(adminToken, "TOKEN_HIDDEN")}`)
    
    const res = await fetch(url)
    const data = await res.json()

    if (res.ok && data.data && data.data.length > 0) {
      const users = data.data.map((u: { id: string; name?: string; tasks?: string[]; user_type?: string }) => ({
        id: u.id,
        name: u.name || "Unknown User",
        tasks: u.tasks || [],
        user_type: u.user_type || "USER"
      }))
      return NextResponse.json({ success: true, data: users })
    }

    // Fallback: Query via business/applications with expansion
    const businessUrl = `https://graph.facebook.com/v25.0/${businessId}/applications?access_token=${adminToken}&fields=id,name,assigned_users{id,name,tasks,user_type}`
    const bRes = await fetch(businessUrl)
    const bData = await bRes.json()

    if (bRes.ok && bData.data) {
      const appEntry = bData.data.find((a: { id: string; assigned_users?: { data: { id: string; name?: string; tasks?: string[]; user_type?: string }[] } }) => String(a.id) === String(appId))
      if (appEntry && appEntry.assigned_users && appEntry.assigned_users.data) {
        const users = appEntry.assigned_users.data.map((u: { id: string; name?: string; tasks?: string[]; user_type?: string }) => ({
          id: u.id,
          name: u.name || "Unknown User",
          tasks: u.tasks || [],
          user_type: u.user_type || "USER"
        }))
        return NextResponse.json({ success: true, data: users })
      }
    }

    return NextResponse.json({ success: true, data: [] })
  } catch (error) {
    console.error("[app_assigned_users] GET Failed:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const adminToken = req.nextUrl.searchParams.get("token")
  const { id: businessId, appId } = await params

  try {
    const { userIds, tasks } = await req.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: "userIds array is required" }, { status: 400 })
    }

    // Facebook requires a separate request for each user to assign to an app via the BM
    const results = await Promise.all(
      userIds.map(async (userId) => {
        const url = `https://graph.facebook.com/v25.0/${appId}/assigned_users`
        const body = {
          business: businessId,
          user: userId,
          tasks: JSON.stringify(tasks || ["ANALYZE"]),
          access_token: adminToken
        }

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })
        return res.json()
      })
    )

    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      return NextResponse.json({ success: false, error: errors[0].error.message, details: errors }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[app_assigned_users] POST Failed:", error)
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const adminToken = req.nextUrl.searchParams.get("token")
  const userId = req.nextUrl.searchParams.get("userId")
  const { id: businessId, appId } = await params

  if (!userId) {
    return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 })
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${appId}/assigned_users?business=${businessId}&user=${userId}&access_token=${adminToken}`
    const res = await fetch(url, { method: "DELETE" })
    const data = await res.json()

    if (!res.ok || data.error) {
      return NextResponse.json({ success: false, error: data.error?.message || "Failed to unassign" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 })
  }
}

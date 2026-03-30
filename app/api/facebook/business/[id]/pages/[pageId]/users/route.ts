import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, pageId: string }> }
) {
  const { id, pageId } = await params
  const adminToken = req.nextUrl.searchParams.get("token")
  if (!adminToken) return NextResponse.json({ error: "Token is required" }, { status: 400 })

  try {
    const { userId, tasks, userType } = await req.json()
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })

    // Default tasks from user's specification
    const pageTasks = tasks || ["MANAGE", "CREATE_CONTENT", "MODERATE", "ADVERTISE", "ANALYZE"]
    
    // Prepare Graph API body
    const body: { user: string; tasks: string[]; access_token: string; business?: string } = {
      user: userId,
      tasks: pageTasks,
      access_token: adminToken
    }

    // Per user specification: for system users, do not include 'business' parameter
    if (userType !== 'system' && userType !== 'local') {
      body.business = id
    }

    const url = `https://graph.facebook.com/v19.0/${pageId}/assigned_users`
    const fbRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })

    const data = await fbRes.json()
    if (data.error) throw new Error(data.error.message)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to assign user" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { pageId } = await params
  const adminToken = req.nextUrl.searchParams.get("token")
  const userId = req.nextUrl.searchParams.get("userId")
  
  if (!adminToken || !userId) return NextResponse.json({ error: "Token and userId are required" }, { status: 400 })

  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/assigned_users?user=${userId}&access_token=${adminToken}`
    const fbRes = await fetch(url, { method: "DELETE" })
    const data = await fbRes.json()

    if (data.error) throw new Error(data.error.message)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Failed to unassign user" }, { status: 500 })
  }
}

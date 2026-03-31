import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const adminToken = req.nextUrl.searchParams.get("token")
  if (!adminToken) {
    return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
  }

  const { id: businessId, pageId } = await params

  try {
    // User recommended endpoint: /{pageId}/assigned_users?business={businessId}
    // This is the most efficient and correct way to get assignments for a single page in a BM context.
    const url = `https://graph.facebook.com/v25.0/${pageId}/assigned_users?business=${businessId}&access_token=${adminToken}&fields=id,name,tasks,user_type`
    
    console.log(`[assigned_users] GET URL: ${url.replace(adminToken, "TOKEN_HIDDEN")}`)
    
    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error("[assigned_users] GET FB Error:", data.error)
      return NextResponse.json({ 
        success: false, 
        error: data.error?.message || "Failed to fetch assigned users",
        fbError: data.error
      }, { status: res.status })
    }

    const assignments = data.data || []

    // Standardize the response data
    const users = assignments.map((u: { id: string; name?: string; tasks?: string[]; user_type?: string }) => ({
      id: u.id,
      name: u.name || "Unknown User",
      tasks: u.tasks || [],
      user_type: u.user_type || "USER"
    }))

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("[assigned_users] GET Failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const adminToken = req.nextUrl.searchParams.get("token")
  if (!adminToken) {
    return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
  }

  const { id: businessId, pageId } = await params

  try {
    const body = await req.json()
    const { userIds, tasks } = body

    if (!userIds || !Array.isArray(userIds) || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ success: false, error: "Missing required fields: userIds (array), tasks (array)" }, { status: 400 })
    }

    if (userIds.length === 0) {
      return NextResponse.json({ success: false, error: "No users selected" }, { status: 400 })
    }

    // Prepare Batch operations
    const operations = userIds.map((uid: string) => {
      // Body needs to be URL encoded for standard FB batch requests (as string in 'body' field)
      const opParams = new URLSearchParams()
      opParams.append("user", uid)
      opParams.append("business", businessId)
      opParams.append("tasks", JSON.stringify(tasks))
      
      return {
        method: "POST",
        relative_url: `${pageId}/assigned_users`,
        body: opParams.toString()
      }
    })

    console.log(`[API] Executing batch assignment for ${userIds.length} users on Page ${pageId}`)

    const batchUrl = `https://graph.facebook.com/v25.0/`
    const batchBody = new URLSearchParams()
    batchBody.append("access_token", adminToken)
    batchBody.append("batch", JSON.stringify(operations))

    const fbRes = await fetch(batchUrl, {
      method: "POST",
      body: batchBody,
      headers: {
        "Accept": "application/json"
      }
    })

    const batchResponse = await fbRes.json()

    // FB Batch API returns an array where each item corresponds to an operation in the request
    if (!Array.isArray(batchResponse)) {
      console.error("[Batch Error] FB returned invalid response:", batchResponse)
      return NextResponse.json({ 
        success: false, 
        error: batchResponse.error?.message || "Invalid Facebook API response" 
      }, { status: 500 })
    }

    // Process individual results
    const errors: string[] = []
    batchResponse.forEach((res, index) => {
      if (res.code !== 200) {
        try {
          const errorBody = JSON.parse(res.body || "{}")
          const msg = errorBody.error?.message || "Unknown error"
          console.error(`[Batch Error] User ${userIds[index]}:`, errorBody.error)
          errors.push(`User ${userIds[index]}: ${msg}`)
        } catch {
          errors.push(`User ${userIds[index]}: HTTP ${res.code}`)
        }
      }
    })

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: errors.join(" | "),
        count: userIds.length - errors.length
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: userIds.length })
  } catch (error) {
    console.error("[Assign Asset] Failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const adminToken = req.nextUrl.searchParams.get("token")
  const userId = req.nextUrl.searchParams.get("userId")
  
  if (!adminToken || !userId) {
    return NextResponse.json({ success: false, error: "Token and userId are required" }, { status: 400 })
  }

  const { pageId } = await params

  try {
    // Correct DELETE endpoint per user curl: /{page_id}/assigned_users?user={user_id}&access_token={adminToken}
    const url = `https://graph.facebook.com/v25.0/${pageId}/assigned_users?user=${userId}&access_token=${adminToken}`
    
    const fbRes = await fetch(url, { method: "DELETE" })
    const data = await fbRes.json()

    if (data.error) {
      console.error("[assigned_users] DELETE FB Error:", data.error)
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[assigned_users] DELETE Failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}

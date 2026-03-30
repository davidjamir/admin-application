import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; systemUserId: string }> }
) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  const { id: businessId, systemUserId } = await params

  if (!token) {
    return NextResponse.json({ success: false, error: "Admin token is required" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { name, action } = body

    // 1. Rename System User (Based on user curl)
    if (name) {
      console.log(`[API] Renaming System User ${systemUserId} to "${name}"...`)
      
      const formData = new URLSearchParams()
      formData.append("system_user_id", systemUserId)
      formData.append("name", name)
      formData.append("access_token", token)

      const url = `https://graph.facebook.com/v25.0/${businessId}/system_users`
      const fbRes = await fetch(url, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      })
      const data = await fbRes.json()

      if (data.error) {
        console.error("[API] Rename Error:", data.error)
        return NextResponse.json({ success: false, error: data.error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    // 2. Revoke All Tokens
    if (action === "revoke_tokens") {
      console.log(`[API] Revoking tokens for System User ${systemUserId}...`)
      
      // FB API for revoking system user tokens is usually DELETE on access_tokens edge 
      // or similar. Following the pattern of updating nodes.
      const url = `https://graph.facebook.com/v25.0/${systemUserId}/access_tokens?access_token=${token}`
      const fbRes = await fetch(url, { method: "DELETE" })
      const data = await fbRes.json()

      if (data.error) {
        console.error("[API] Revoke Error:", data.error)
        return NextResponse.json({ success: false, error: data.error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data })
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[API] System User Update Failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}

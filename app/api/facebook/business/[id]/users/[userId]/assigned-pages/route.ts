import { NextRequest, NextResponse } from "next/server"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const adminToken = req.nextUrl.searchParams.get("token")
  if (!adminToken) {
    return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
  }

  const { userId } = await params

  try {
    const url = `https://graph.facebook.com/v19.0/${userId}/assigned_pages?access_token=${adminToken}&fields=id,name,category,perms&limit=100`
    const fbRes = await fetch(url)
    const data = await fbRes.json()

    if (data.error) {
      console.error("[assigned_pages] FB Error:", data.error)
      return NextResponse.json({ success: false, error: data.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data: data.data || [] })
  } catch (error) {
    console.error("[assigned_pages] Fetch Failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}

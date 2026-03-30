import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const resolvedParams = await params
  const businessId = resolvedParams.id

  if (!token || !businessId) {
    return NextResponse.json({ error: "Token and Business ID are required" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { name, role } = body

    if (!name || !role) {
      return NextResponse.json({ error: "Name and role (ADMIN/USER) are required" }, { status: 400 })
    }

    const url = new URL(`https://graph.facebook.com/v25.0/${encodeURIComponent(businessId)}/system_users`)
    url.searchParams.set("name", name)
    url.searchParams.set("role", role)
    url.searchParams.set("access_token", token)

    console.log(`[API] Creating system user "${name}" for Business ${businessId}...`)
    
    const res = await fetch(url.toString(), { method: "POST" })
    const data = await res.json()

    if (!res.ok || data.error) {
      console.error(`[API] Facebook Error:`, data.error)
      throw new Error(data.error?.message || "Failed to create system user")
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(`[API] POST system-users error:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

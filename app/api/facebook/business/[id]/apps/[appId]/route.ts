import { NextResponse } from "next/server"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; appId: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  
  // Await the params
  const resolvedParams = await params
  const businessId = resolvedParams.id
  const appId = resolvedParams.appId

  if (!token || !businessId || !appId) {
    return NextResponse.json({ error: "Token, Business ID, and App ID are required" }, { status: 400 })
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${businessId}/apps`
    const formData = new FormData()
    formData.append("app_id", appId)
    formData.append("access_token", token)

    const res = await fetch(url, {
      method: "DELETE",
      body: formData
    })

    const data = await res.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(`Error deleting app ${appId} from business ${businessId}:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to delete app" }, { status: 500 })
  }
}

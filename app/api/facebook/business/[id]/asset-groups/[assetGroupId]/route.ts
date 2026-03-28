import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; assetGroupId: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  try {
    const resolvedParams = await params
    const { assetGroupId } = resolvedParams
    
    // Parse the body to get the new name
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required and must be a string" }, { status: 400 })
    }

    const url = new URL(`https://graph.facebook.com/v22.0/${assetGroupId}`)
    url.searchParams.set("access_token", token)
    url.searchParams.set("name", name)

    const res = await fetch(url.toString(), {
      method: "POST"
    })

    const data = await res.json()

    if (!res.ok || data.error) {
       console.error(`[API] Failed to rename asset group ${assetGroupId}:`, data.error)
       return NextResponse.json({ error: data.error?.message || "Failed to rename asset group" }, { status: res.status !== 200 ? res.status : 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(`[API] Error renaming asset group:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to rename asset group" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; assetGroupId: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  
  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 })
  }

  try {
    const resolvedParams = await params
    const { assetGroupId } = resolvedParams

    const url = new URL(`https://graph.facebook.com/v22.0/${assetGroupId}`)
    url.searchParams.set("access_token", token)

    const res = await fetch(url.toString(), {
      method: "DELETE"
    })

    const data = await res.json()

    if (!res.ok || data.error) {
       console.error(`[API] Failed to lock/delete asset group ${assetGroupId}:`, data.error)
       return NextResponse.json({ error: data.error?.message || "Failed to lock asset group" }, { status: res.status !== 200 ? res.status : 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error(`[API] Error locking asset group:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to lock asset group" }, { status: 500 })
  }
}

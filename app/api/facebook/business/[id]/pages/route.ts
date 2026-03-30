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
    const { pageIds } = body

    if (!pageIds || !Array.isArray(pageIds) || pageIds.length === 0) {
      return NextResponse.json({ error: "Page IDs array is required" }, { status: 400 })
    }

    // Facebook Batch API limits to 50 requests per batch usually
    const batch = pageIds.map((id, index) => ({
      method: "POST",
      relative_url: `${encodeURIComponent(businessId)}/owned_pages`,
      body: `page_id=${id}`,
      name: `add_page_${index}`
    }))

    const formData = new URLSearchParams()
    formData.append("access_token", token)
    formData.append("batch", JSON.stringify(batch))

    console.log(`[API] Batch adding ${pageIds.length} pages to Business ${businessId}...`)
    
    const res = await fetch("https://graph.facebook.com", {
      method: "POST",
      body: formData
    })

    const results = await res.json()

    if (!res.ok) {
      console.error(`[API] Batch request failed:`, results)
      throw new Error(results.error?.message || "Batch request failed")
    }

    interface BatchResponseItem {
      code: number
      body?: string
    }

    const summary = (results as BatchResponseItem[]).map((r, i: number) => ({
      id: pageIds[i],
      success: r.code === 200,
      body: r.body ? JSON.parse(r.body) : null,
      code: r.code
    }))

    const totalSuccess = summary.filter((s) => s.success).length
    const totalFailed = summary.length - totalSuccess

    return NextResponse.json({ 
      success: true, 
      summary,
      message: `Successfully added ${totalSuccess} pages. ${totalFailed} failed.`
    })
  } catch (error) {
    console.error(`[API] POST batch-add-pages error:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const pageId = searchParams.get("page_id")
  const { id: businessId } = await params

  if (!token || !businessId || !pageId) {
    return NextResponse.json({ error: "Token, Business ID, and Page ID are required" }, { status: 400 })
  }

  try {
    const url = `https://graph.facebook.com/v25.0/${businessId}/pages?page_id=${pageId}&access_token=${token}`
    
    console.log(`[API] Removing Page ${pageId} from Business ${businessId}...`)
    
    const res = await fetch(url, {
      method: "DELETE"
    })

    const data = await res.json()

    if (!res.ok || data.error) {
      console.error(`[API] DELETE page failed:`, data)
      throw new Error(data.error?.message || "Failed to remove page from business")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[API] DELETE page error:`, error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 })
  }
}

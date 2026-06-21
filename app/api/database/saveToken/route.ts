import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export const runtime = "nodejs"

export interface PagePayload {
  pageId: string
  name: string
  source: string
  systemUserId: string
  systemUserName: string
  appName: string
  category: string
  token: string
  status?: string
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    if (!Array.isArray(payload)) {
      return NextResponse.json({ success: false, message: "Payload must be an array" }, { status: 400 })
    }

    const db = await getDb()
    const col = db.collection("pages")

    const operations = payload.map((item: PagePayload) => {
      const filter = { pageId: item.pageId }
      const now = new Date()
      
      const update = {
        $set: {
          ...item,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      }

      return col.findOneAndUpdate(filter, update, {
        upsert: true,
        returnDocument: "after",
      })
    })

    await Promise.all(operations)

    return NextResponse.json({
      success: true,
      message: "Pages successfully saved/updated.",
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, message: "Failed to save pages", error: message },
      { status: 500 }
    )
  }
}

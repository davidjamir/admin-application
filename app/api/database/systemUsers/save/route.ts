import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { SystemUser } from "@/types/facebook"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { id, changes } = (await req.json()) as { id: string; changes: Partial<SystemUser> }

    if (!id || !changes || Object.keys(changes).length === 0) {
      return NextResponse.json({ success: false, message: "Invalid update data" }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date()

    const updatePayload = {
      ...changes,
      updatedAt: now,
    }
    
    // Safety check: never allow manual update of internal id or _id
    delete (updatePayload as Record<string, unknown>).id
    delete (updatePayload as Record<string, unknown>)._id

    console.log("Updating system user:", id, "Changes:", Object.keys(changes))

    const result = await db.collection("system_users").findOneAndUpdate(
      { id },
      { $set: updatePayload },
      { returnDocument: "after", upsert: true }
    )

    if (!result) {
      return NextResponse.json({ success: false, message: "System user not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "System user updated",
      data: result
    })
  } catch (error: unknown) {
    console.error("Critical error in update system user:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, message: "Failed to update system user", error: message },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { password, id } = (await req.json()) as { password?: string; id?: string }
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 })
    }

    const db = await getDb()
    const result = await db.collection("system_users").deleteOne({ id })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "System user deleted" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, message: "Failed to delete system user", error: message },
      { status: 500 }
    )
  }
}

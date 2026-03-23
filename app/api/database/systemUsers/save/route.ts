import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { SystemUser } from "@/types/facebook"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { password, user } = (await req.json()) as { password?: string; user?: SystemUser }
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    if (!user || !user.id || !user.token) {
      return NextResponse.json({ success: false, message: "Invalid user data" }, { status: 400 })
    }

    const db = await getDb()
    const now = new Date()

    const updateData = {
      ...user,
      updatedAt: now,
    }
    delete (updateData as any)._id

    await db.collection("system_users").updateOne(
      { id: user.id },
      {
        $set: updateData,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, message: "System user saved" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, message: "Failed to save system user", error: message },
      { status: 500 }
    )
  }
}

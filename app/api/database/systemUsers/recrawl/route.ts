import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { facebookService } from "@/services/facebook.service"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const { password, id } = (await req.json()) as { password?: string; id?: string }
    // Password requirement removed per user request

    if (!id) {
      return NextResponse.json({ success: false, message: "Invalid ID" }, { status: 400 })
    }

    const db = await getDb()
    const user = await db.collection("system_users").findOne({ id })

    if (!user || !user.token) {
      return NextResponse.json({ success: false, message: "User or token not found" }, { status: 404 })
    }

    // Refresh user info from Facebook
    const fbUser = await facebookService.getMe(user.token)
    const businesses = await facebookService.getBusinesses(user.token)
    
    // Find the business this user belongs to (if any)
    const business = businesses.find((b) => b.id === user.businessId) || businesses[0]

    const updateData = {
      name: fbUser.name,
      businessId: business?.id,
      businessName: business?.name,
      updatedAt: new Date(),
    }

    await db.collection("system_users").updateOne({ id }, { $set: updateData })

    return NextResponse.json({ success: true, message: "System user recrawled" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { success: false, message: "Failed to recrawl system user", error: message },
      { status: 500 }
    )
  }
}

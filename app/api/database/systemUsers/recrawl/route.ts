import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { facebookService } from "@/services/facebook.service"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let targetId: string | undefined
  try {
    const { id } = (await req.json()) as { id?: string }
    targetId = id
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
    
    // IDENTITY VERIFICATION: Ensure the token actually belongs to the user we're recrawling
    if (fbUser.id !== id) {
      console.error(`Identity mismatch: target ${id}, token belongs to ${fbUser.id}`)
      return NextResponse.json({ 
        success: false, 
        message: "Identity mismatch: Token belongs to a different user. Recrawl aborted to prevent data corruption." 
      }, { status: 403 })
    }

    const fbName = fbUser.name

    // Step 1: Transform names by split-by-space replacement (exact word match)
    const nameMap: Record<string, string> = {
      "NB": "NBA",
      "NF": "NFL",
      "NH": "NHL",
      "ML": "MLB",
      "Mu": "Music",
      "Mus": "Music",
      "Musi": "Music",
      "Mo": "Movie",
      "Mov": "Movie",
      "Movi": "Movie",
      "Storer": "Store"
    }

    const transformedName = fbName.split(" ").map(word => nameMap[word] || word).join(" ")
    const nameParts = transformedName.split("-").map(p => p.trim())
    
    // Parse name: Code Role - Tên BM - Category
    let roleCode = ""
    let role = "Admin"
    let businessName = ""
    let category = ""

    if (nameParts.length >= 1) {
      roleCode = nameParts[0]
      if (roleCode.toUpperCase() === "EM") role = "Employee"
      else if (roleCode.toUpperCase() === "AD") role = "Admin"
    }
    if (nameParts.length >= 2) {
      businessName = nameParts[1]
    }
    if (nameParts.length >= 3) {
      const rawNote = nameParts[2]
      // Preserve numbers and use previously transformed parts, split by comma for deduplication
      category = rawNote.split(",")
        .map(p => {
          const part = p.trim().replace(/\d+/g, "").trim()
          return nameMap[part] || part
        })
        .filter((v, i, a) => v && a.indexOf(v) === i)
        .join(", ")
    }

    const updateData: Record<string, string | Date> = {
      name: transformedName,
      roleCode,
      role,
      updatedAt: new Date(),
    }


    // Preserve businessId as requested, only update businessName if parsed
    if (businessName) {
      updateData.businessName = businessName
    }
    if (category) {
      updateData.category = category
    }

    if (user.appName) {
      updateData.appName = user.appName.charAt(0).toUpperCase() + user.appName.slice(1)
    }

    // Set status to Active on successful recrawl
    updateData.status = "Active"

    await db.collection("system_users").updateOne({ id }, { $set: updateData })

    return NextResponse.json({ success: true, message: "System user recrawled with data preservation" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    
    // Update status to Disabled in database on failure
    try {
      const db = await getDb()
      if (targetId) {
        await db.collection("system_users").updateOne({ id: targetId }, { $set: { status: "Disabled", updatedAt: new Date() } })
      }
    } catch (dbError) {
      console.error("Failed to update status to Disabled:", dbError)
    }

    return NextResponse.json(
      { success: false, message: "Failed to recrawl system user", error: message },
      { status: 500 }
    )
  }
}

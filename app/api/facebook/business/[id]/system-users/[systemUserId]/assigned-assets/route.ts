import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

/**
 * UNORTHODOX METHOD: Fetch assigned pages via /me/accounts using the system user's local token.
 * This bypasses restrictions on unverified Business Managers.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; systemUserId: string }> }
) {
  const { id: businessId, systemUserId } = await params
  const { searchParams } = new URL(req.url)
  const force = searchParams.get("force") === "true"

  try {
    const db = await getDb()
    
    // 1. Find the target system user in local database
    const targetUser = await db.collection("system_users").findOne({
      id: systemUserId,
      businessId: businessId,
      status: "active"
    })

    if (!targetUser || !targetUser.token) {
      return NextResponse.json({ 
        success: false, 
        error: "Active system user with token not found in local database." 
      }, { status: 404 })
    }

    // 2. Fetch pages via /me/accounts
    console.log(`[API] Fetching unorthodox assets for ${targetUser.name} (${targetUser.roleCode})...`)
    const fbUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token,tasks&limit=250&access_token=${targetUser.token}`
    const fbRes = await fetch(fbUrl, { cache: force ? "no-store" : "default" })
    const fbData = await fbRes.json()

    if (fbData.error) {
      console.error("[API] FB Error (/me/accounts):", fbData.error)
      return NextResponse.json({ success: false, error: fbData.error.message }, { status: 400 })
    }

    // 3. Determine the correct token to use for interactions (Unassign/Assign)
    // - If target is AD (Admin): Use their own token
    // - If target is EM (Employee): Find an AD in DB with the same appName (Source App)
    let actionToken = targetUser.token
    let actionUser = targetUser.name

    if (targetUser.roleCode === "EM") {
      const adUser = await db.collection("system_users").findOne({
        businessId: businessId,
        appName: targetUser.appName,
        roleCode: "AD",
        status: "active"
      })
      
      if (adUser && adUser.token) {
        actionToken = adUser.token
        actionUser = adUser.name
        console.log(`[API] Using AD token from "${adUser.name}" for EM "${targetUser.name}" (App: ${targetUser.appName})`)
      } else {
        console.warn(`[API] No active AD found for EM "${targetUser.name}" with App "${targetUser.appName}"`)
        // Fallback to EM token if no AD found, though the user says it might not work
      }
    }

    return NextResponse.json({
      success: true,
      data: fbData.data || [],
      metadata: {
        method: "me_accounts",
        role: targetUser.roleCode,
        appName: targetUser.appName,
        actionUser: actionUser,
        canInteract: !!actionToken
      },
      // Safely pass the action token to the frontend for subsequent calls
      actionToken: actionToken 
    })
  } catch (error) {
    console.error("[API] Unorthodox asset fetch failed:", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Internal Server Error" 
    }, { status: 500 })
  }
}

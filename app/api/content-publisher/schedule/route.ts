import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { getServerSession } from "@/lib/auth/session"

/**
 * Bulk assign publishing targets; actual schedule times are computed server-side.
 * Extend the TODO block with Mongo updates / queue writes.
 */
export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Expected JSON object" }, { status: 400 })
  }

  const { socialIds, pageOid, category, channel } = body as Record<string, unknown>

  if (!Array.isArray(socialIds) || socialIds.length === 0) {
    return NextResponse.json({ error: "socialIds must be a non-empty array" }, { status: 400 })
  }

  for (const id of socialIds) {
    if (typeof id !== "string" || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: `Invalid social id: ${String(id)}` }, { status: 400 })
    }
  }

  if (typeof pageOid !== "string" || !ObjectId.isValid(pageOid)) {
    return NextResponse.json({ error: "pageOid must be a valid ObjectId string" }, { status: 400 })
  }

  if (category != null && typeof category !== "string") {
    return NextResponse.json({ error: "category must be a string when provided" }, { status: 400 })
  }

  if (channel != null && typeof channel !== "string") {
    return NextResponse.json({ error: "channel must be a string when provided" }, { status: 400 })
  }

  const categoryStr = typeof category === "string" ? category.trim() : ""
  const channelStr = typeof channel === "string" ? channel.trim() : ""

  const payload = {
    socialIds: socialIds as string[],
    pageOid: pageOid.trim(),
    category: categoryStr,
    channel: channelStr,
  }

  // TODO: apply schedule — e.g. update social docs, enqueue page queue, trigger automations.
  // await getSocialItemsDb() …

  return NextResponse.json({
    success: true,
    message:
      `${payload.socialIds.length} item(s): targets recorded; assign automatic scheduling in the POST handler.`,
    count: payload.socialIds.length,
    ...payload,
  })
}

import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import { ZodError } from "zod"
import { getOriginsCollection } from "@/lib/origins-db"
import { serializeOrigin } from "@/lib/origin-serialize"
import { parseOriginPatch } from "@/lib/origin-patch"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid origin id" }, { status: 400 })
    }

    const origins = await getOriginsCollection()
    const doc = await origins.findOne({ _id: new ObjectId(id) })
    if (!doc) {
      return NextResponse.json({ error: "Origin not found" }, { status: 404 })
    }

    return NextResponse.json({ item: serializeOrigin(doc as Record<string, unknown>) })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[ORIGINS_GET]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid origin id" }, { status: 400 })
    }

    const body = await request.json()
    const { set } = parseOriginPatch(body)

    const origins = await getOriginsCollection()
    const result = await origins.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: set },
      { returnDocument: "after" },
    )

    if (!result) {
      return NextResponse.json({ error: "Origin not found" }, { status: 404 })
    }

    return NextResponse.json({ item: serializeOrigin(result as Record<string, unknown>) })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid payload", details: error.issues },
        { status: 400 },
      )
    }
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[ORIGINS_PATCH]", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

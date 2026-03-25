import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const blogs = (await db.collection("blogs").find({}, { projection: { blogDns: 1 } }).toArray()) as Array<{ blogDns?: string }>

    const uniqueOrigins = new Set<string>()
    blogs.forEach((b: { blogDns?: string }) => {
      if (b.blogDns) {
        const parts = b.blogDns.split(".")
        if (parts.length >= 2) {
          uniqueOrigins.add(parts.slice(-2).join("."))
        }
      }
    })

    return NextResponse.json(Array.from(uniqueOrigins).sort())
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("[DOMAINS_API_ERROR]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

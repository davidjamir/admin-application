import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"

export async function GET() {
  try {
    const db = await getDb()
    const accounts = await db.collection("account_api")
      .find({})
      .sort({ updatedAt: -1 })
      .toArray()

    return NextResponse.json({ data: accounts })
  } catch (error) {
    console.error("Failed to fetch blogger accounts:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getDb } from "@/lib/mongodb"
import { redis } from "@/lib/redis"

export const runtime = "nodejs"

export async function GET() {
  const stats = {
    mongodb: { status: "Offline", latency: 0, load: "0%" },
    redis: { status: "Offline", latency: 0, load: "0%" },
    facebook: { status: "Offline", latency: 0, load: "0ms" },
    system: { status: "Healthy", latency: 0, load: "0/0" },
  }

  try {
    // 1. MongoDB Health Check
    const mongoStart = Date.now()
    try {
      const db = await getDb()
      await db.command({ ping: 1 })
      stats.mongodb.status = "Healthy"
      stats.mongodb.latency = Date.now() - mongoStart
      
      // Get a rough "load" indicator based on connections or stats
      const dbStats = await db.stats()
      stats.mongodb.load = `${Math.round((dbStats.dataSize / (1024 * 1024)))}MB`
    } catch {
      stats.mongodb.status = "Error"
    }

    // 2. Redis Health Check
    const redisStart = Date.now()
    try {
      const ping = await redis.ping()
      if (ping === "PONG") {
        stats.redis.status = "Active"
        stats.redis.latency = Date.now() - redisStart
        
        // Upstash doesn't give "load" easily via ping but we can show latency
        stats.redis.load = `${stats.redis.latency}ms`
      }
    } catch {
      stats.redis.status = "Error"
    }

    // 3. Facebook API Health Check
    const fbStart = Date.now()
    try {
      const db = await getDb()
      const samplePage = await db.collection("pages").findOne({ token: { $exists: true } })
      
      if (samplePage?.token) {
        const fbRes = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${samplePage.token}`)
        if (fbRes.ok) {
          stats.facebook.status = "Online"
          stats.facebook.latency = Date.now() - fbStart
          stats.facebook.load = `${stats.facebook.latency}ms`
        } else {
          stats.facebook.status = "Degraded"
        }
      } else {
        stats.facebook.status = "No Tokens"
      }
    } catch {
      stats.facebook.status = "Error"
    }

    // 4. System/Worker load
    const mem = process.memoryUsage()
    stats.system.load = `${Math.round(mem.heapUsed / 1024 / 1024)}MB`
    stats.system.status = mem.heapUsed > mem.heapTotal * 0.9 ? "Warning" : "Healthy"

    return NextResponse.json({
      success: true,
      data: stats,
      timestamp: Date.now()
    })
  } catch (error: unknown) {
    console.error("[HEALTH_CHECK_ERROR]", error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Health check failed" 
    }, { status: 500 })
  }
}

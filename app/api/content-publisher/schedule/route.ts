import { NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth/session"

/**
 * Server-only env (no NEXT_PUBLIC_):
 * - `CONTENT_PUBLISHER_SCHEDULE_URL` — upstream schedule API (absolute or same-origin path)
 * - `CONTENT_PUBLISHER_SCHEDULE_DISABLED` — `"true"` to block all publish
 * - `CONTENT_PUBLISHER_SCHEDULE_CRON_SECRET` — Bearer token gửi kèm mỗi POST upstream (fallback: `CRON_SECRET`)
 */

function cronBearerSecret(): string {
  return (
    (process.env.CONTENT_PUBLISHER_SCHEDULE_CRON_SECRET ?? "").trim() ||
    (process.env.CRON_SECRET ?? "").trim()
  )
}

function resolveUpstreamUrl(raw: string, request: Request): string {
  const t = raw.trim()
  if (/^https?:\/\//i.test(t)) return t
  const path = t.startsWith("/") ? t : `/${t}`
  return new URL(path, new URL(request.url).origin).toString()
}

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const disabled = process.env.CONTENT_PUBLISHER_SCHEDULE_DISABLED === "true"
  const urlConfigured = (process.env.CONTENT_PUBLISHER_SCHEDULE_URL ?? "").trim().length > 0
  const cronSecretConfigured = cronBearerSecret().length > 0
  const locked = disabled || !urlConfigured || !cronSecretConfigured

  return NextResponse.json({
    locked,
    disabled,
    urlConfigured,
    cronSecretConfigured,
  })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (process.env.CONTENT_PUBLISHER_SCHEDULE_DISABLED === "true") {
    return NextResponse.json(
      { error: "Gửi lên lịch đang tắt (CONTENT_PUBLISHER_SCHEDULE_DISABLED)." },
      { status: 403 }
    )
  }

  const rawUrl = (process.env.CONTENT_PUBLISHER_SCHEDULE_URL ?? "").trim()
  if (!rawUrl) {
    return NextResponse.json(
      { error: "Chưa cấu hình CONTENT_PUBLISHER_SCHEDULE_URL." },
      { status: 503 }
    )
  }

  const bearer = cronBearerSecret()
  if (!bearer) {
    return NextResponse.json(
      {
        error:
          "Chưa cấu hình Bearer: đặt CONTENT_PUBLISHER_SCHEDULE_CRON_SECRET hoặc CRON_SECRET.",
      },
      { status: 503 }
    )
  }

  const targetUrl = resolveUpstreamUrl(rawUrl, request)
  const body = await request.text()

  const upstream = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      Authorization: `Bearer ${bearer}`,
    },
    body,
  })

  const text = await upstream.text()
  const contentType = upstream.headers.get("content-type") ?? "application/json"

  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": contentType },
  })
}

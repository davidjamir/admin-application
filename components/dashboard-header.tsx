"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"

const TZ_LINES = [
  {
    id: "hanoi",
    label: "Hanoi",
    timeZone: "Asia/Ho_Chi_Minh",
    labelBadge:
      "rounded-md bg-gradient-to-r from-emerald-100/85 via-teal-50/45 to-white px-2 py-0.5 text-[10px] font-medium tracking-tight text-foreground shadow-none sm:text-[11px] dark:from-emerald-950/40 dark:via-teal-950/22 dark:to-white/92",
  },
  {
    id: "ny",
    label: "New York",
    timeZone: "America/New_York",
    labelBadge:
      "rounded-md bg-gradient-to-r from-sky-100/85 via-blue-50/45 to-white px-2 py-0.5 text-[10px] font-medium tracking-tight text-foreground shadow-none sm:text-[11px] dark:from-sky-950/40 dark:via-blue-950/22 dark:to-white/92",
  },
] as const

/** Same pattern both zones — e.g. Thu · May 02, 26 · 14:03:52 */
function formatHeaderClockLine(date: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  const parts = fmt.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPart["type"]) =>
    parts.find((p) => p.type === type)?.value ?? ""
  const wd = get("weekday").replace(/\.$/, "").slice(0, 3)
  const d = get("day")
  const mo = get("month").replace(/\.$/, "")
  const y = get("year").slice(-2)
  const h = get("hour")
  const min = get("minute")
  const s = get("second")
  return `${wd} · ${mo} ${d}, ${y} · ${h}:${min}:${s}`
}

function HeaderWorldClocks() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div suppressHydrationWarning aria-live="polite">
      <div className="flex min-w-[15.5rem] flex-col divide-y divide-border/50 rounded-lg bg-muted/20 py-px dark:bg-muted/25 sm:min-w-[16.75rem]">
        {TZ_LINES.map(({ id, label, timeZone, labelBadge }) => (
          <div key={id} className="flex items-baseline justify-between gap-x-6 px-2.5 py-1">
            <span className={`inline-block shrink-0 tracking-tight ${labelBadge}`}>{label}</span>
            <time
              suppressHydrationWarning
              className="text-end text-[10px] tracking-tight text-foreground sm:text-[11px]"
              dateTime={now.toISOString()}
            >
              <span className="inline-block whitespace-nowrap font-mono tabular-nums font-medium">{formatHeaderClockLine(now, timeZone)}</span>
            </time>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardHeader() {
  const pathname = usePathname()

  const routeMap: Record<string, string> = {
    "/": "Dashboard",
    "/pages": "Pages Management",
    "/schedules": "Schedules Manager",
    "/content-publisher": "Content Publisher",
    "/analytics": "Traffic Analytics",
    "/settings": "Settings",
    "/business-manager": "Business Manager",
    "/website-manager": "Websites Manager",
    "/ad-creatives": "Ad Creatives",
    "/blogger-accounts": "Blogger API",
  }

  const formattedTitle = routeMap[pathname] || "Dashboard"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">7 Forge Inc</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{formattedTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-3">
        <HeaderWorldClocks />
        <ThemeToggle />
      </div>
    </header>
  )
}

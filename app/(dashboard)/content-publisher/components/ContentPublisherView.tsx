"use client"

import React from "react"
import {
  CalendarClock,
  Calendar,
  Clock,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCcw,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Separator } from "@/components/ui/separator"
import { AnimatePresence, motion } from "framer-motion"
import type { ContentPublisherRow, ContentPublisherResponse, PublisherPlatform } from "../types"
import { PLATFORMS } from "../types"
import { cn } from "@/lib/utils"
import type { MongoPageData } from "@/hooks/useFacebookPages"

const TZ_HCM = "Asia/Ho_Chi_Minh"

/** Omit `createdDay` query → API skips date filter for listing */
const CREATED_DAY_ALL = "__all_days__"

/** Omit `socialMode` → no filter on publishing mode */
const SOCIAL_MODE_ALL = "__all_social_mode__"

/** Waiting to assign targets to `pages` — sent as query `needs_page` */
const SOCIAL_MODE_NEEDS_PAGE = "needs_page"

/** Omit `chatName` query → all channels */
const CHANNEL_ALL = "__all_channels__"

const HCM_DISPLAY: Intl.DateTimeFormatOptions = {
  timeZone: TZ_HCM,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
}

function formatYmdHcm(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ_HCM })
}

function formatTs(ts: number) {
  return new Date(ts).toLocaleString("en-GB", HCM_DISPLAY)
}

/** Deterministic avatar for mock previews (demo only). */
function demoPageAvatarUrl(pageName: string, backgroundHex: string) {
  const name = encodeURIComponent((pageName || "Page").slice(0, 48))
  return `https://ui-avatars.com/api/?name=${name}&size=128&background=${backgroundHex}&color=ffffff&bold=true&format=png`
}

function DemoVerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-flex shrink-0 leading-none [&>svg]:size-4", className)}
      title="Verified Page (preview)"
    >
      <svg viewBox="0 0 24 24" aria-hidden fill="none">
        <circle cx="12" cy="12" r="10" fill="#0866FF" />
        <path
          d="M8.25 11.95 10.85 14.55 15.95 9.05"
          stroke="white"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function SocialPreviewMock({
  platform,
  title,
  body,
  pageName,
  linkUrl,
  thumbnailUrl,
}: {
  platform: PublisherPlatform
  title: string
  body: string
  pageName: string
  linkUrl: string | null
  thumbnailUrl?: string | null
}) {
  const line = body.slice(0, 280) + (body.length > 280 ? "…" : "")
  const host = linkUrl ? (() => { try { return new URL(linkUrl).hostname } catch { return linkUrl } })() : null

  const mediaBlock = thumbnailUrl ? (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- CDN / Telegram / Blogger thumbnails */}
      <img
        src={thumbnailUrl}
        alt=""
        className="h-full w-full object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </>
  ) : null

  if (platform === "instagram" || platform === "threads") {
    const igAvatar = demoPageAvatarUrl(pageName || "page", platform === "instagram" ? "E4405F" : "363636")

    return (
      <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className="flex items-center gap-2 border-b px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- demo avatar */}
          <img
            src={igAvatar}
            alt=""
            className={cn(
              "size-9 shrink-0 rounded-full bg-muted object-cover ring-2",
              platform === "instagram" ? "ring-pink-500/35" : "ring-neutral-500/35"
            )}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <p className="truncate font-semibold text-sm">{pageName?.replace(/\s+/g, "_").toLowerCase() || "your_page"}</p>
            <DemoVerifiedBadge />
          </div>
          <span className="text-muted-foreground">⋯</span>
        </div>
        <div className={cn("aspect-square w-full bg-muted", mediaBlock ? "relative overflow-hidden" : "")}>
          {mediaBlock ?? null}
        </div>
        <div className="space-y-1 p-3 text-xs">
          <p className="whitespace-pre-wrap text-muted-foreground">{line || title}</p>
          {host ? <p className="truncate text-[10px] text-primary">{host}</p> : null}
        </div>
      </div>
    )
  }

  if (platform === "x") {
    const avatar = demoPageAvatarUrl(pageName || "page", "1d9bf0")
    const handle = pageName?.replace(/\s+/g, "").slice(0, 20).toLowerCase() || "page"

    const mediaSection = thumbnailUrl ? (
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-muted shadow-sm dark:border-white/[0.08]">
        <div className="relative aspect-video w-full max-h-72 min-h-[8.5rem] bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- queue thumbnail */}
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    ) : null

    return (
      <div className="mx-auto w-full max-w-md rounded-xl border bg-background px-4 py-3 text-sm shadow-sm">
        <div className="flex gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- demo avatar */}
          <img src={avatar} alt="" className="size-10 shrink-0 rounded-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
              <span className="font-bold">{pageName || "Page"}</span>
              <DemoVerifiedBadge className="-mt-px" />
            </div>
            <p className="text-[11px] leading-tight text-muted-foreground">
              @{handle}{" "}
              <span className="select-none text-muted-foreground/50">·</span> 2h
            </p>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-normal text-foreground">{line || title}</p>

            {mediaSection}

            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-block max-w-full truncate text-[13px] font-medium text-sky-500 hover:underline dark:text-sky-400"
              >
                {host || linkUrl}
              </a>
            ) : null}
            {!thumbnailUrl ? (
              <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                No image attachment — the queue item thumbnail will appear here when available.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  /* facebook */
  const fbAvatar = demoPageAvatarUrl(pageName || "Facebook Page", "1877f2")

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="border-b bg-muted/40 px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- demo avatar */}
          <img
            src={fbAvatar}
            alt=""
            className="size-10 shrink-0 rounded-full object-cover ring-2 ring-background"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
              <p className="text-sm font-semibold leading-tight">{pageName || "Facebook Page"}</p>
              <DemoVerifiedBadge className="-mt-px" />
            </div>
            <p className="text-[10px] text-muted-foreground">Sponsored · 🌎</p>
          </div>
        </div>
      </div>
      <p className="px-3 pt-3 text-[15px] leading-snug">{line || title}</p>
      {(linkUrl || thumbnailUrl) && (
        <div className="m-3 overflow-hidden rounded-md border bg-muted/30">
          <div className="relative h-32 w-full overflow-hidden bg-muted">
            {mediaBlock ?? <span className="absolute inset-0 bg-gradient-to-br from-muted to-muted/60" />}
          </div>
          {(host || title) && linkUrl ? (
            <div className="space-y-0.5 p-2">
              {host ? <p className="text-[10px] uppercase text-muted-foreground">{host}</p> : null}
              <p className="line-clamp-2 text-xs font-medium">{title}</p>
            </div>
          ) : thumbnailUrl && !linkUrl ? (
            <div className="space-y-0.5 p-2">
              <p className="line-clamp-2 text-[10px] text-muted-foreground">Image / viral post preview</p>
            </div>
          ) : null}
        </div>
      )}
      <div className="border-t border-border/70 bg-muted/10 px-3 py-3">
        <p className="mb-2 text-[10px] font-medium text-muted-foreground">
          First · CTA comment with link <span className="italic font-normal text-muted-foreground/90">preview</span>
        </p>
        <div className="flex gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- demo page avatar */}
          <img
            src={fbAvatar}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover ring-1 ring-border/50"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="rounded-2xl rounded-tl-md bg-muted/45 px-3 py-2">
              <div className="flex flex-wrap items-center gap-x-1 gap-y-0">
                <p className="text-[11px] font-semibold leading-tight text-foreground">
                  {pageName || "Facebook Page"}
                </p>
                <DemoVerifiedBadge className="[&>svg]:size-3.5" />
              </div>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                Article link pinned in first comment 👇{" "}
                <span className="text-[10px] italic text-muted-foreground/75">preview</span>
              </p>
            </div>
            {linkUrl ? (
              <a
                href={linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "overflow-hidden rounded-lg border border-blue-600/35 bg-blue-600/15 transition-colors hover:bg-blue-600/25 dark:border-blue-500/35 dark:bg-blue-600/25",
                  thumbnailUrl ? "flex" : "flex items-start gap-2 px-2.5 py-2"
                )}
              >
                {thumbnailUrl ? (
                  <>
                    <div className="relative h-[5.75rem] w-[6.75rem] shrink-0 bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={thumbnailUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex min-h-[5.75rem] min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2 text-left">
                      {host ? (
                        <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{host}</p>
                      ) : null}
                      <p className="line-clamp-3 text-xs font-semibold leading-snug text-blue-950 dark:text-blue-50">{title}</p>
                      <p className="line-clamp-1 break-all font-mono text-[10px] text-muted-foreground">{linkUrl}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0 text-blue-700 dark:text-blue-400" aria-hidden />
                    <div className="min-w-0 flex-1 text-left">
                      {host ? (
                        <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{host}</p>
                      ) : null}
                      <p className="line-clamp-2 text-xs font-medium text-blue-800 dark:text-blue-100">{title}</p>
                      <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground">{linkUrl}</p>
                    </div>
                  </>
                )}
              </a>
            ) : (
              <p className="rounded-lg border border-dashed border-muted-foreground/35 px-2.5 py-2 text-[11px] text-muted-foreground">
                No <code className="text-[10px]">linkUrl</code> — add a URL for the comment CTA link preview.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Memoized row: toggling selection avoids re-running formatTs/badge tree for unrelated rows */
const PublisherResultRowItem = React.memo(function PublisherResultRowItem({
  row,
  isSelected,
  toggleRowSelected,
  handleCheckboxChecked,
  setPreviewRow,
  setPlatform,
  setDeleteTarget,
}: {
  row: ContentPublisherRow
  isSelected: boolean
  toggleRowSelected: (rowId: string) => void
  handleCheckboxChecked: (rowId: string, checked: boolean) => void
  setPreviewRow: React.Dispatch<React.SetStateAction<ContentPublisherRow | null>>
  setPlatform: React.Dispatch<React.SetStateAction<PublisherPlatform>>
  setDeleteTarget: React.Dispatch<React.SetStateAction<ContentPublisherRow | null>>
}) {
  return (
    <li
      className={cn(
        "group/row flex cursor-pointer items-stretch gap-4 border-l-[3px] border-transparent px-4 py-4 outline-none ring-offset-background hover:bg-muted/50 focus-within:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
        isSelected && "border-l-primary bg-primary/[0.08] hover:bg-primary/[0.08]"
      )}
      onClick={() => toggleRowSelected(row.id)}
    >
      <div
        role="button"
        tabIndex={0}
        className="flex min-h-0 min-w-0 flex-1 cursor-default gap-4 self-stretch rounded-md outline-none ring-offset-background focus-visible:bg-muted/20 focus-visible:ring-2 focus-visible:ring-ring/60 sm:items-start"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            toggleRowSelected(row.id)
          }
        }}
      >
        {row.thumbnailUrl ? (
          <div className="relative mt-0.5 size-24 shrink-0 overflow-hidden rounded-lg border bg-muted sm:size-28">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.thumbnailUrl}
              alt=""
              className="size-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground"
              title={row.itemId}
            >
              {row.itemId.length > 8 ? `${row.itemId.slice(0, 8)}…` : row.itemId}
            </span>
            {row.pipeline ? (
              <Badge variant="default" className="cursor-default text-[10px] capitalize">
                {row.pipeline}
              </Badge>
            ) : null}
            {row.itemStatus ? (
              <Badge variant="secondary" className="cursor-default text-[10px] capitalize">
                {row.itemStatus}
              </Badge>
            ) : null}
            {row.topic ? (
              <Badge variant="secondary" className="cursor-default text-[10px]">
                {row.topic}
              </Badge>
            ) : null}
            {row.page ? (
              <Badge variant="outline" className="cursor-default text-[10px] font-normal">
                {row.page}
              </Badge>
            ) : null}
            {row.channel ? (
              <Badge
                variant="outline"
                className="max-w-[14rem] cursor-default truncate text-[10px] font-normal"
                title={row.channel}
              >
                {row.channel}
              </Badge>
            ) : null}
          </div>
          <p className="cursor-default select-none font-medium leading-snug line-clamp-2">{row.previewTitle}</p>
          <p className="cursor-default select-none text-xs text-muted-foreground line-clamp-2">
            {row.previewBody || "No body text stored on this row."}
          </p>
          <p className="cursor-default text-[11px] text-muted-foreground">
            Queued · {formatTs(row.scheduleAt)} · Created {formatTs(row.createdAt)}
          </p>
        </div>
      </div>
      <div
        className="flex shrink-0 items-center gap-1 self-start pt-0.5"
        data-row-actions
        role="group"
        aria-label="Row actions"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="cursor-pointer gap-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          title="Social preview"
          onClick={() => {
            setPreviewRow(row)
            setPlatform("facebook")
          }}
        >
          <Eye className="size-3 shrink-0" aria-hidden />
          Preview
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
          title="Remove from queue"
          onClick={() => setDeleteTarget(row)}
        >
          <Trash2 />
        </Button>
        <div className="relative flex size-6 shrink-0 items-center justify-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(c) => handleCheckboxChecked(row.id, c === true)}
            aria-label={`Select row ${row.itemId}`}
            className="absolute inset-0 z-0 m-auto size-4 opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=checked]:opacity-100"
          />
        </div>
      </div>
    </li>
  )
})

export function ContentPublisherView() {
  const [items, setItems] = React.useState<ContentPublisherRow[]>([])
  const [topics, setTopics] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [topic, setTopic] = React.useState<string>("__all__")
  const [pipeline, setPipeline] = React.useState<string>("traffic")
  const [channel, setChannel] = React.useState<string>(CHANNEL_ALL)
  const [channelChoices, setChannelChoices] = React.useState<string[]>([])
  const [socialMode, setSocialMode] = React.useState<string>(SOCIAL_MODE_ALL)
  const [createdDay, setCreatedDay] = React.useState(() => formatYmdHcm(new Date()))
  const [createdDayChoices, setCreatedDayChoices] = React.useState<string[]>(() => [
    formatYmdHcm(new Date()),
  ])
  const [selectedRowIds, setSelectedRowIds] = React.useState<string[]>([])
  const [previewRow, setPreviewRow] = React.useState<ContentPublisherRow | null>(null)
  const [platform, setPlatform] = React.useState<PublisherPlatform>("facebook")
  const [deleteTarget, setDeleteTarget] = React.useState<ContentPublisherRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [lastFetchedAt, setLastFetchedAt] = React.useState<Date | null>(null)

  const hasBulkScheduleSelection = selectedRowIds.length > 0

  /** Pages for “Schedule to page” picker — scaffold until bulk schedule API lands. */
  const [bulkSchedulePages, setBulkSchedulePages] = React.useState<MongoPageData[]>([])
  const [bulkSchedulePagesLoading, setBulkSchedulePagesLoading] = React.useState(false)
  const [bulkSchedulePageOid, setBulkSchedulePageOid] = React.useState("")
  const [bulkScheduleAtLocal, setBulkScheduleAtLocal] = React.useState("")

  React.useEffect(() => {
    if (!hasBulkScheduleSelection) {
      setBulkSchedulePageOid("")
      setBulkScheduleAtLocal("")
      return
    }
    let cancelled = false
    setBulkSchedulePagesLoading(true)
    void fetch(`/api/pages`)
      .then((r) => r.json())
      .then((j: { data?: MongoPageData[] }) => {
        if (!cancelled) setBulkSchedulePages(Array.isArray(j.data) ? j.data : [])
      })
      .catch(() => {
        if (!cancelled) setBulkSchedulePages([])
      })
      .finally(() => {
        if (!cancelled) setBulkSchedulePagesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [hasBulkScheduleSelection])

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const sp = new URLSearchParams()
      if (debouncedSearch) sp.set("search", debouncedSearch)
      if (topic && topic !== "__all__") sp.set("topic", topic)
      if (pipeline === "traffic" || pipeline === "viral") sp.set("pipeline", pipeline)
      if (channel !== CHANNEL_ALL) sp.set("chatName", channel)
      if (
        socialMode === "auto" ||
        socialMode === "manual" ||
        socialMode === SOCIAL_MODE_NEEDS_PAGE
      )
        sp.set("socialMode", socialMode)
      if (createdDay !== CREATED_DAY_ALL) sp.set("createdDay", createdDay)

      const res = await fetch(`/api/content-publisher?${sp.toString()}`)
      const json = (await res.json()) as ContentPublisherResponse

      if (!res.ok) {
        throw new Error(json.error || "Failed to load")
      }
      setItems(json.items ?? [])
      setTopics(json.topics ?? [])
      const mergedChannels = [
        ...new Set([
          ...(channel !== CHANNEL_ALL ? [channel] : []),
          ...(json.channels ?? []),
        ]),
      ].sort((a, b) => a.localeCompare(b))
      setChannelChoices(mergedChannels)
      const todayStr = formatYmdHcm(new Date())
      const mergedDays = [
        ...new Set([
          todayStr,
          ...(createdDay !== CREATED_DAY_ALL ? [createdDay] : []),
          ...(json.createdDays ?? []),
        ]),
      ].sort((a, b) => b.localeCompare(a))
      setCreatedDayChoices(mergedDays)
      setLastFetchedAt(new Date())
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Failed to load publisher data")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, topic, pipeline, channel, socialMode, createdDay])

  const toggleRowSelected = React.useCallback((rowId: string) => {
    setSelectedRowIds((prev) => {
      const s = new Set(prev)
      if (s.has(rowId)) {
        s.delete(rowId)
      } else {
        s.add(rowId)
      }
      return Array.from(s)
    })
  }, [])

  const selectedRowIdSet = React.useMemo(() => new Set(selectedRowIds), [selectedRowIds])

  const handleCheckboxChecked = React.useCallback((rowId: string, checked: boolean) => {
    setSelectedRowIds((prev) => {
      const s = new Set(prev)
      if (checked) {
        s.add(rowId)
      } else {
        s.delete(rowId)
      }
      return Array.from(s)
    })
  }, [])

  React.useEffect(() => {
    setSelectedRowIds((prev) => prev.filter((id) => items.some((r) => r.id === id)))
  }, [items])

  React.useEffect(() => {
    setPreviewRow((prev) => {
      if (!prev) return null
      return items.find((r) => r.id === prev.id) ?? null
    })
  }, [items])

  React.useEffect(() => {
    void load()
  }, [load])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/content-publisher/${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast.success("Item removed")
      setDeleteTarget(null)
      if (previewRow?.id === deleteTarget.id) setPreviewRow(null)
      setSelectedRowIds((prev) => prev.filter((id) => id !== deleteTarget.id))
      await load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 text-foreground">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="shrink-0 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 shadow-sm">
            <Share2 className="size-8 text-blue-500" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black dark:text-white">Content Publisher</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {lastFetchedAt ? (
            <span className="flex items-center gap-1.5 text-xs italic text-muted-foreground">
              <Clock className="size-3.5 shrink-0 opacity-70" aria-hidden />
              Data synced:{" "}
              {lastFetchedAt.toLocaleString("en-US", {
                timeZone: TZ_HCM,
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
              })}
            </span>
          ) : (
            <span className="text-xs italic text-muted-foreground md:text-right">
              Waiting for first successful sync…
            </span>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            title="Refresh data"
            className={cn(
              "rounded-md border p-2 transition-all active:scale-95",
              loading
                ? "cursor-wait border-emerald-500/20 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400"
                : "cursor-pointer border-transparent bg-muted/50 text-muted-foreground hover:border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500 dark:text-emerald-400"
            )}
          >
            <RefreshCcw className={cn("size-4", loading && "animate-spin")} aria-hidden />
          </button>
        </div>
      </div>

      <Card size="sm" className="gap-2 py-2 ring-0 shadow-none">
        <CardContent className="space-y-3 py-2">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <div className="flex w-full min-w-[56rem] flex-nowrap items-end gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                <Label>Topic</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger className="w-full min-w-0 cursor-pointer">
                    <SelectValue placeholder="All topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__" className="cursor-pointer">
                      All topics
                    </SelectItem>
                    {topics.map((t) => (
                      <SelectItem key={t} value={t} className="cursor-pointer">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor="publisher-channel">Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger id="publisher-channel" className="w-full min-w-0 cursor-pointer">
                    <SelectValue placeholder="All channels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CHANNEL_ALL} className="cursor-pointer">
                      All channels
                    </SelectItem>
                    {channelChoices.map((name) => (
                      <SelectItem key={name} value={name} className="cursor-pointer">
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="publisher-social-mode">Social mode</Label>
              <Select value={socialMode} onValueChange={setSocialMode}>
                <SelectTrigger id="publisher-social-mode" className="w-full cursor-pointer">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SOCIAL_MODE_ALL} className="cursor-pointer">
                    All types
                  </SelectItem>
                  <SelectItem value={SOCIAL_MODE_NEEDS_PAGE} className="cursor-pointer">
                    Needs page
                  </SelectItem>
                  <SelectItem value="auto" className="cursor-pointer">
                    Auto
                  </SelectItem>
                  <SelectItem value="manual" className="cursor-pointer">
                    Manual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="publisher-created-day">Date</Label>
              <Select value={createdDay} onValueChange={setCreatedDay}>
                <SelectTrigger id="publisher-created-day" className="w-full cursor-pointer">
                  <SelectValue placeholder="Pick day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CREATED_DAY_ALL} className="cursor-pointer">
                    All days
                  </SelectItem>
                  {createdDayChoices.map((ymd) => {
                    const isToday = ymd === formatYmdHcm(new Date())
                    return (
                      <SelectItem key={ymd} value={ymd} className="cursor-pointer">
                        {isToday ? `${ymd} (Today)` : ymd}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <Label htmlFor="publisher-pipeline">Pipeline</Label>
              <Select value={pipeline} onValueChange={setPipeline}>
                <SelectTrigger id="publisher-pipeline" className="w-full cursor-pointer">
                  <SelectValue placeholder="Pipeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traffic" className="cursor-pointer">
                    Traffic
                  </SelectItem>
                  <SelectItem value="viral" className="cursor-pointer">
                    Viral
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>
          <div className="relative min-w-0 w-full">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Item id, caption, channel, link, page…"
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <AnimatePresence initial={false}>
        {hasBulkScheduleSelection ? (
          <motion.div
            key="bulk-schedule-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Card
              size="sm"
              className="gap-3 border-primary/25 bg-muted/25 py-3 ring-primary/15 dark:bg-muted/20"
              role="region"
              aria-labelledby="publisher-bulk-schedule-heading"
            >
              <CardHeader className="space-y-0 border-b pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2">
                    <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarClock className="size-4" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <CardTitle id="publisher-bulk-schedule-heading" className="text-sm font-semibold">
                        Schedule publish
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {selectedRowIds.length === 1
                          ? "1 item selected — pick a Page and publication time."
                          : `${selectedRowIds.length} items selected — applies to each when you hook the submit handler.`}{" "}
                        Time below is interpreted in your browser timezone; convert to unix for the API if needed (
                        {TZ_HCM} preferred for operations).
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="publisher-bulk-target-page">Target Page</Label>
                    <Select
                      value={bulkSchedulePageOid === "" ? undefined : bulkSchedulePageOid}
                      onValueChange={setBulkSchedulePageOid}
                      disabled={bulkSchedulePagesLoading || bulkSchedulePages.length === 0}
                    >
                      <SelectTrigger
                        id="publisher-bulk-target-page"
                        className="w-full cursor-pointer"
                      >
                        {bulkSchedulePagesLoading ? (
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin shrink-0" aria-hidden />
                            Loading pages…
                          </span>
                        ) : (
                          <SelectValue placeholder="Choose a Page" />
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        {bulkSchedulePages.map((p) => (
                          <SelectItem key={p._id.$oid} value={p._id.$oid} className="cursor-pointer">
                            <span className="truncate">{p.name || p.pageId}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!bulkSchedulePagesLoading && bulkSchedulePages.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground">
                        No pages returned from <code className="text-[10px]">/api/pages</code>.
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="publisher-bulk-schedule-datetime">Publish time</Label>
                    <Input
                      id="publisher-bulk-schedule-datetime"
                      type="datetime-local"
                      className="cursor-pointer tabular-nums"
                      value={bulkScheduleAtLocal}
                      onChange={(e) => setBulkScheduleAtLocal(e.target.value)}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Wire this input to your API (unix ms or RFC string).
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-border/60 pt-4">
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="cursor-not-allowed opacity-70"
                    disabled
                    title="Replace with fetch() when API is ready"
                  >
                    Apply schedule
                  </Button>
                  <p className="min-w-0 flex-1 text-[11px] text-muted-foreground">
                    Payload stub:{" "}
                    <code className="rounded bg-muted px-1 py-px font-mono text-[10px]">{`selectedRowIds`}</code>
                    , <code className="rounded bg-muted px-1 py-px font-mono text-[10px]">bulkSchedulePageOid</code>
                    , <code className="rounded bg-muted px-1 py-px font-mono text-[10px]">{`bulkScheduleAtLocal`}</code>
                    .
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Card size="sm" className="min-h-[320px]">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b">
          <CardTitle className="min-w-0 flex-1 text-sm font-semibold leading-snug">
            Results · {items.length}
            {selectedRowIds.length > 0 ? (
              <span className="ml-2 font-normal text-muted-foreground">
                · {selectedRowIds.length} selected
              </span>
            ) : null}
          </CardTitle>
          <div className="flex h-6 shrink-0 items-center justify-end">
            {selectedRowIds.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                title="Clear selected"
                className="cursor-pointer border-destructive/35 text-destructive/80 hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                onClick={() => setSelectedRowIds([])}
              >
                <X className="size-3 shrink-0" aria-hidden />
                Clear
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No matching items.</p>
          ) : (
            <ul className="divide-y">
              {items.map((row) => (
                <PublisherResultRowItem
                  key={row.id}
                  row={row}
                  isSelected={selectedRowIdSet.has(row.id)}
                  toggleRowSelected={toggleRowSelected}
                  handleCheckboxChecked={handleCheckboxChecked}
                  setPreviewRow={setPreviewRow}
                  setPlatform={setPlatform}
                  setDeleteTarget={setDeleteTarget}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!previewRow} onOpenChange={(o) => !o && setPreviewRow(null)}>
        <SheetContent
          side="right"
          className={cn(
            "flex h-full flex-col gap-0 overflow-hidden p-0 shadow-2xl",
            "border-l border-border/60 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-md",
            "max-sm:!max-w-full max-sm:!w-full",
            "sm:!min-w-[30vw] sm:!w-[min(92vw,56rem)] sm:!max-w-[min(92vw,56rem)]"
          )}
        >
          {previewRow && (
            <>
              <SheetHeader className="shrink-0 space-y-4 border-b bg-muted/25 px-6 py-5 pr-14 text-left backdrop-blur-sm supports-[backdrop-filter]:backdrop-blur-md">
                <div className="flex gap-4">
                  {previewRow.thumbnailUrl ? (
                    <div className="relative aspect-square w-28 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted/40 shadow-inner ring-1 ring-black/[0.04] dark:bg-muted/80 dark:ring-white/[0.06] sm:w-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewRow.thumbnailUrl}
                        alt=""
                        className="absolute inset-0 size-full object-cover object-center"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 space-y-4">
                    <SheetTitle className="line-clamp-5 text-balance text-lg font-semibold leading-snug tracking-tight">
                      {previewRow.previewTitle}
                    </SheetTitle>
                    <SheetDescription className="sr-only">
                      Scheduled content details for this queue entry.
                    </SheetDescription>
                    <div className="flex flex-wrap gap-1.5">
                      {previewRow.pipeline && (
                        <Badge variant="default" className="capitalize">
                          {previewRow.pipeline}
                        </Badge>
                      )}
                      {previewRow.itemStatus && (
                        <Badge variant="secondary" className="capitalize">
                          {previewRow.itemStatus}
                        </Badge>
                      )}
                      {previewRow.page && <Badge variant="outline">{previewRow.page}</Badge>}
                      {previewRow.topic && <Badge variant="secondary">{previewRow.topic}</Badge>}
                      {previewRow.channel ? (
                        <Badge variant="outline" className="max-w-full truncate font-normal">
                          {previewRow.channel}
                        </Badge>
                      ) : null}
                    </div>
                    {previewRow.linkUrl ? (
                      <Button variant="outline" size="sm" className="w-fit cursor-pointer gap-2 shadow-sm" asChild>
                        <a href={previewRow.linkUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />
                          Open in new tab
                        </a>
                      </Button>
                    ) : null}
                    <section aria-label="Scheduled and creation times">
                      <div className="flex flex-col gap-2.5 sm:flex-row sm:gap-3">
                        <div className="flex min-w-0 flex-1 gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5 ring-1 ring-inset ring-border/40 dark:bg-muted/25">
                          <Calendar className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <div className="min-w-0">
                            <p className="text-[11px] leading-none text-muted-foreground">Scheduled</p>
                            <p className="mt-1 text-sm font-medium leading-snug tabular-nums tracking-tight">
                              {formatTs(previewRow.scheduleAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex min-w-0 flex-1 gap-2.5 rounded-lg bg-muted/40 px-3 py-2.5 ring-1 ring-inset ring-border/40 dark:bg-muted/25">
                          <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <div className="min-w-0">
                            <p className="text-[11px] leading-none text-muted-foreground">Created</p>
                            <p className="mt-1 text-sm font-medium leading-snug tabular-nums tracking-tight">
                              {formatTs(previewRow.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </SheetHeader>

              <div className="min-h-0 flex flex-1 flex-col overflow-y-auto">
                <div className="space-y-8 px-6 py-7">
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Share2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        Social preview
                      </p>
                      <span className="text-[11px] text-muted-foreground">Predicted render</span>
                    </div>
                    <ToggleGroup
                      type="single"
                      value={platform}
                      onValueChange={(v) => v && setPlatform(v as PublisherPlatform)}
                      variant="outline"
                      size="sm"
                      spacing={0}
                      className="flex flex-wrap justify-start gap-1"
                    >
                      {PLATFORMS.map((p) => (
                        <ToggleGroupItem key={p.id} value={p.id} className="cursor-pointer px-3 text-xs">
                          {p.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    <div className="rounded-xl border border-border/60 bg-gradient-to-b from-muted/40 to-muted/15 p-4 shadow-inner dark:from-muted/20 dark:to-muted/5">
                      <SocialPreviewMock
                        platform={platform}
                        title={previewRow.previewTitle}
                        body={previewRow.previewBody}
                        pageName={previewRow.page || "Page"}
                        linkUrl={previewRow.linkUrl}
                        thumbnailUrl={previewRow.thumbnailUrl}
                      />
                    </div>
                  </section>

                  <Separator className="bg-border/70" />

                  <details className="group rounded-xl border border-border/70 bg-muted/15 text-sm open:bg-muted/25">
                    <summary className="cursor-pointer select-none px-4 py-3 font-medium hover:bg-muted/30 [&::-webkit-details-marker]:hidden [&::marker]:content-none">
                      <span className="inline-flex items-center gap-2">
                        Raw document
                        <span className="rounded bg-muted px-1.5 py-px text-[10px] font-normal text-muted-foreground group-open:bg-background">
                          JSON
                        </span>
                      </span>
                    </summary>
                    <pre className="max-h-52 overflow-auto border-t border-border/60 bg-background/90 p-4 text-[10px] leading-relaxed text-muted-foreground">
                      {JSON.stringify(previewRow.raw, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this queue item?</DialogTitle>
            <DialogDescription>
              This deletes the document in collection <code className="text-xs">social</code> on{" "}
              <code className="text-xs">MONGODB_URI2</code>. Cached lists may refresh on next load.
            </DialogDescription>
          </DialogHeader>
          {deleteTarget && (
            <p className="text-sm font-mono text-muted-foreground truncate">{deleteTarget.itemId}</p>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer" disabled={deleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              className="cursor-pointer"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              {deleting ? "Removing…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

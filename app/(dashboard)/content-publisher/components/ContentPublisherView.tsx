"use client"

import React from "react"
import {
  Calendar,
  Clock,
  ExternalLink,
  Link2,
  Loader2,
  RefreshCcw,
  Search,
  Share2,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import type { ContentPublisherRow, ContentPublisherResponse, PublisherPlatform } from "../types"
import { PLATFORMS } from "../types"
import { cn } from "@/lib/utils"

const HCM: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
}

function formatTs(ts: number) {
  return new Date(ts).toLocaleString("en-GB", HCM)
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
    return (
      <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-xl border bg-background shadow-sm">
        <div className={cn("aspect-square w-full bg-muted", mediaBlock ? "relative overflow-hidden" : "")}>
          {mediaBlock ?? null}
        </div>
        <div className="space-y-1 p-3 text-xs">
          <p className="font-semibold">{pageName || "Your page"}</p>
          <p className="text-muted-foreground whitespace-pre-wrap">{line || title}</p>
          {host && (
            <p className="truncate text-[10px] text-primary">{host}</p>
          )}
        </div>
      </div>
    )
  }

  if (platform === "tiktok") {
    return (
      <div className="mx-auto flex aspect-[9/16] w-full max-w-[220px] flex-col overflow-hidden rounded-2xl border-2 border-foreground/10 bg-black text-white shadow-lg">
        <div className="relative flex-1 overflow-hidden bg-gradient-to-b from-zinc-800 to-black">
          {thumbnailUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-55"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="relative z-[1] p-3">
                <p className="text-[11px] font-semibold opacity-90">@{pageName?.replace(/\s+/g, "") || "page"}</p>
                <p className="mt-4 text-sm leading-snug whitespace-pre-wrap">{line || title}</p>
              </div>
            </>
          ) : (
            <div className="p-3">
              <p className="text-[11px] font-semibold opacity-90">@{pageName?.replace(/\s+/g, "") || "page"}</p>
              <p className="mt-4 text-sm leading-snug whitespace-pre-wrap">{line || title}</p>
            </div>
          )}
        </div>
        <div className="border-t border-white/10 p-2 text-center text-[10px] text-white/60">
          Predicted preview
        </div>
      </div>
    )
  }

  if (platform === "x") {
    return (
      <div className="mx-auto w-full max-w-md rounded-xl border bg-background p-3 text-sm shadow-sm">
        <div className="flex gap-2">
          <div className="size-10 shrink-0 rounded-full bg-muted" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">{pageName || "Page"}</p>
            <p className="mt-1 whitespace-pre-wrap text-foreground/90">{line || title}</p>
            {host && <p className="mt-2 text-xs text-primary">{host}</p>}
          </div>
        </div>
      </div>
    )
  }

  /* facebook default */
  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-lg border bg-card shadow-sm">
      <div className="border-b bg-muted/40 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="size-9 rounded-full bg-muted" />
          <div>
            <p className="text-sm font-semibold leading-tight">{pageName || "Facebook Page"}</p>
            <p className="text-[10px] text-muted-foreground">Sponsored · 🌎</p>
          </div>
        </div>
      </div>
      <p className="px-3 pt-3 text-[15px] leading-snug">{line || title}</p>
      {(linkUrl || thumbnailUrl) && (
        <div className="m-3 overflow-hidden rounded-md border bg-muted/30">
          <div className="relative h-32 w-full overflow-hidden bg-muted">
            {mediaBlock}
          </div>
          {(host || title) && linkUrl ? (
            <div className="space-y-0.5 p-2">
              {host ? (
                <p className="text-[10px] uppercase text-muted-foreground">{host}</p>
              ) : null}
              <p className="line-clamp-2 text-xs font-medium">{title}</p>
            </div>
          ) : thumbnailUrl && !linkUrl ? (
            <div className="space-y-0.5 p-2">
              <p className="line-clamp-2 text-[10px] text-muted-foreground">Image / viral post preview</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export function ContentPublisherView() {
  const [items, setItems] = React.useState<ContentPublisherRow[]>([])
  const [topics, setTopics] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchInput, setSearchInput] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [topic, setTopic] = React.useState<string>("__all__")
  const [pipeline, setPipeline] = React.useState<string>("__all__")
  const [chatId, setChatId] = React.useState("")
  const [dateFrom, setDateFrom] = React.useState("")
  const [dateTo, setDateTo] = React.useState("")

  const [selected, setSelected] = React.useState<ContentPublisherRow | null>(null)
  const [platform, setPlatform] = React.useState<PublisherPlatform>("facebook")
  const [deleteTarget, setDeleteTarget] = React.useState<ContentPublisherRow | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [lastFetchedAt, setLastFetchedAt] = React.useState<Date | null>(null)

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
      if (pipeline && pipeline !== "__all__") sp.set("pipeline", pipeline)
      if (chatId.trim()) sp.set("chatId", chatId.trim())
      if (dateFrom) sp.set("dateFrom", dateFrom)
      if (dateTo) sp.set("dateTo", dateTo)

      const res = await fetch(`/api/content-publisher?${sp.toString()}`)
      const json = (await res.json()) as ContentPublisherResponse

      if (!res.ok) {
        throw new Error(json.error || "Failed to load")
      }
      setItems(json.items ?? [])
      setTopics(json.topics ?? [])
      setLastFetchedAt(new Date())
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : "Failed to load publisher data")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, topic, pipeline, chatId, dateFrom, dateTo])

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
      if (selected?.id === deleteTarget.id) setSelected(null)
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
            <p className="text-muted-foreground text-sm font-medium">
              Traffic & viral from the archive — filter, open a row for preview or delete.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          {lastFetchedAt ? (
            <span className="flex items-center gap-1.5 text-xs italic text-muted-foreground">
              <Clock className="size-3.5 shrink-0 opacity-70" aria-hidden />
              Data synced:{" "}
              {lastFetchedAt.toLocaleString("en-US", {
                timeZone: "Asia/Ho_Chi_Minh",
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters & search</CardTitle>
          <CardDescription>Search and narrow the list — dates use Asia/Ho_Chi_Minh.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-xl">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search item ID, page, topic, caption, link…"
              className="pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <Label>Pipeline</Label>
              <Select value={pipeline} onValueChange={setPipeline}>
                <SelectTrigger className="w-full min-w-0 cursor-pointer">
                  <SelectValue placeholder="All pipelines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="cursor-pointer">
                    All pipelines
                  </SelectItem>
                  <SelectItem value="traffic" className="cursor-pointer">
                    Traffic
                  </SelectItem>
                  <SelectItem value="viral" className="cursor-pointer">
                    Viral
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="publisher-chat-id">Chat / conversation ID</Label>
              <Input
                id="publisher-chat-id"
                placeholder="telegram / chat id…"
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="publisher-date-from">From (HCM)</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="publisher-date-from"
                  type="date"
                  className="pl-9"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="publisher-date-to">To (HCM)</Label>
              <div className="relative">
                <Calendar className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  id="publisher-date-to"
                  type="date"
                  className="pl-9"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[320px]">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-base">Social archive</CardTitle>
            <CardDescription>
              Newest activity first · {items.length} loaded.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No items match your filters.</p>
          ) : (
            <ul className="divide-y">
              {items.map((row) => (
                <li
                  key={row.id}
                  className={cn(
                    "flex cursor-pointer gap-3 p-4 transition-colors hover:bg-muted/50 sm:items-start"
                  )}
                  onClick={() => {
                    setSelected(row)
                    setPlatform("facebook")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault()
                      setSelected(row)
                      setPlatform("facebook")
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {row.thumbnailUrl ? (
                    <div className="relative mt-0.5 hidden size-14 shrink-0 overflow-hidden rounded-md border bg-muted sm:block">
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
                      <span className="max-w-full truncate font-mono text-xs text-muted-foreground">{row.itemId}</span>
                      {row.pipeline && (
                        <Badge variant="default" className="text-[10px] capitalize">
                          {row.pipeline}
                        </Badge>
                      )}
                      {row.itemStatus && (
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {row.itemStatus}
                        </Badge>
                      )}
                      {row.topic && (
                        <Badge variant="secondary" className="text-[10px]">
                          {row.topic}
                        </Badge>
                      )}
                      {row.page && (
                        <Badge variant="outline" className="text-[10px] font-normal">
                          {row.page}
                        </Badge>
                      )}
                      {row.chatId && (
                        <Badge variant="outline" className="text-[10px] font-mono font-normal">
                          chat: {row.chatId.slice(0, 12)}
                          {row.chatId.length > 12 ? "…" : ""}
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium leading-snug line-clamp-2">{row.previewTitle}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{row.previewBody || "No body text stored on this row."}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Queued · {formatTs(row.scheduleAt)} · Created {formatTs(row.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 self-start pt-0.5 sm:flex-col sm:items-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-xs"
                      className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                      title="Remove from queue"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTarget(row)
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl md:max-w-3xl lg:max-w-4xl">
          {selected && (
            <>
              <SheetHeader className="space-y-1 border-b pb-4 text-left">
                <SheetTitle className="pr-10">{selected.previewTitle}</SheetTitle>
                <SheetDescription className="font-mono text-xs">{selected.itemId}</SheetDescription>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-6 py-6">
                <div className="flex flex-wrap gap-2 text-xs">
                  {selected.pipeline && (
                    <Badge variant="default" className="capitalize">
                      {selected.pipeline}
                    </Badge>
                  )}
                  {selected.itemStatus && (
                    <Badge variant="secondary" className="capitalize">
                      {selected.itemStatus}
                    </Badge>
                  )}
                  {selected.page && <Badge variant="outline">{selected.page}</Badge>}
                  {selected.topic && <Badge variant="secondary">{selected.topic}</Badge>}
                  {selected.chatId && <Badge className="font-mono font-normal">chat: {selected.chatId}</Badge>}
                </div>

                {selected.thumbnailUrl ? (
                  <div className="overflow-hidden rounded-lg border bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selected.thumbnailUrl}
                      alt=""
                      className="max-h-52 w-full object-cover object-center"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null}

                <div className="grid gap-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Scheduled</span>{" "}
                    <span className="font-medium">{formatTs(selected.scheduleAt)}</span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Created</span>{" "}
                    <span className="font-medium">{formatTs(selected.createdAt)}</span>
                  </p>
                </div>

                {selected.linkUrl && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Link2 className="size-4" />
                      Link preview
                    </p>
                    <div className="rounded-lg border bg-muted/30 p-3 text-xs break-all">
                      {selected.linkUrl}
                    </div>
                    <Button variant="outline" size="sm" className="cursor-pointer gap-2 w-fit" asChild>
                      <a href={selected.linkUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5" />
                        Open in new tab
                      </a>
                    </Button>
                  </div>
                )}

                {selected.internalLinkHint && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Link2 className="size-4" />
                      Internal reference (no public URL)
                    </p>
                    <div className="rounded-lg border bg-muted/30 p-3 font-mono text-xs break-all text-muted-foreground">
                      {selected.internalLinkHint}
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm font-medium">Social preview (predicted)</p>
                  <ToggleGroup
                    type="single"
                    value={platform}
                    onValueChange={(v) => v && setPlatform(v as PublisherPlatform)}
                    variant="outline"
                    size="sm"
                    spacing={0}
                    className="flex flex-wrap justify-start"
                  >
                    {PLATFORMS.map((p) => (
                      <ToggleGroupItem key={p.id} value={p.id} className="cursor-pointer px-3 text-xs">
                        {p.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <SocialPreviewMock
                      platform={platform}
                      title={selected.previewTitle}
                      body={selected.previewBody}
                      pageName={selected.page || "Page"}
                      linkUrl={selected.linkUrl}
                      thumbnailUrl={selected.thumbnailUrl}
                    />
                  </div>
                </div>

                <Separator />

                <details className="rounded-md border text-sm">
                  <summary className="cursor-pointer px-3 py-2 font-medium">Raw document</summary>
                  <pre className="max-h-48 overflow-auto border-t bg-muted/30 p-3 text-[10px] leading-relaxed">
                    {JSON.stringify(selected.raw, null, 2)}
                  </pre>
                </details>
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

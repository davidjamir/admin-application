"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { OriginAdUnit, OriginAdsScript, OriginDocument } from "@/types/origin"
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Power,
  Code2,
  CopyPlus,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export type AdPlacementKey =
  | "adsHeader"
  | "adsFooter"
  | "adsLeftSidebar"
  | "adsRightSidebar"
  | "inPost"
  | "beforePost"
  | "afterPost"
  | "adsVideoHeader"

export const PLACEMENT_INFO: Record<
  AdPlacementKey,
  { title: string; prefix: string; isSingleton: boolean }
> = {
  adsHeader: {
    title: "Header Ads",
    prefix: "ads-header",
    isSingleton: false,
  },
  adsFooter: {
    title: "Footer Ads",
    prefix: "ads-footer",
    isSingleton: false,
  },
  adsLeftSidebar: {
    title: "Left Sidebar Ads",
    prefix: "ads-left",
    isSingleton: false,
  },
  adsRightSidebar: {
    title: "Right Sidebar Ads",
    prefix: "ads-right",
    isSingleton: false,
  },
  inPost: {
    title: "In-Post Ads",
    prefix: "ads-in-post",
    isSingleton: false,
  },
  beforePost: {
    title: "Before Post",
    prefix: "before-post",
    isSingleton: true,
  },
  afterPost: {
    title: "After Post",
    prefix: "after-post",
    isSingleton: true,
  },
  adsVideoHeader: {
    title: "Video Header",
    prefix: "ads-video-header",
    isSingleton: true,
  },
}

function AdUnitCard({
  unit,
  index,
  totalUnits,
  onChange,
  onDuplicate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  unit: OriginAdUnit
  index?: number
  totalUnits?: number
  onChange: (updated: OriginAdUnit) => void
  onDuplicate?: () => void
  onRemove?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const lineCount = unit.content ? unit.content.split("\n").length : 0
  const isFirst = index === 0
  const isLast = typeof index === "number" && typeof totalUnits === "number" && index === totalUnits - 1

  const handleCopy = () => {
    navigator.clipboard.writeText(unit.content || "")
    setCopied(true)
    toast.success("Markup copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        unit.enabled
          ? "border-emerald-500/35 bg-card"
          : "border-destructive/30 bg-card"
      }`}
    >
      <div className="px-4 py-3 space-y-2.5">
        {/* Row 1: Toggle + Index + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...unit, enabled: !unit.enabled })}
              className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-all duration-200 ${
                unit.enabled
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-destructive text-white hover:bg-destructive/80"
              }`}
            >
              <Power className="size-3" />
              {unit.enabled ? "Enabled" : "Disabled"}
            </button>
            {typeof index === "number" && (
              <span className="font-mono text-[11px] text-muted-foreground">
                #{index + 1}{totalUnits ? ` / ${totalUnits}` : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Reorder — clean bordered square buttons */}
            {(onMoveUp || onMoveDown) && (
              <>
                {onMoveUp && (
                  <button
                    type="button"
                    onClick={onMoveUp}
                    disabled={isFirst}
                    title="Move up"
                    className={`flex size-7 items-center justify-center rounded-md border text-sm transition-colors ${
                      isFirst
                        ? "border-border/40 text-muted-foreground/30 cursor-not-allowed"
                        : "border-border bg-muted/30 text-foreground hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                    }`}
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                )}
                {onMoveDown && (
                  <button
                    type="button"
                    onClick={onMoveDown}
                    disabled={isLast}
                    title="Move down"
                    className={`flex size-7 items-center justify-center rounded-md border text-sm transition-colors ${
                      isLast
                        ? "border-border/40 text-muted-foreground/30 cursor-not-allowed"
                        : "border-border bg-muted/30 text-foreground hover:bg-emerald-600 hover:text-white hover:border-emerald-600"
                    }`}
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                )}
              </>
            )}
            <div className="w-px h-5 bg-border mx-0.5" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="size-7 text-muted-foreground hover:text-foreground"
              title="Copy markup"
            >
              {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            </Button>
            {onDuplicate && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDuplicate}
                className="size-7 text-muted-foreground hover:text-foreground"
                title="Duplicate"
              >
                <CopyPlus className="size-3.5" />
              </Button>
            )}
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onRemove}
                className="size-7 text-destructive hover:bg-destructive/10"
                title="Delete"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Row 2: ID + Source */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              ID
            </Label>
            <Input
              value={unit.id ?? ""}
              onChange={(e) => onChange({ ...unit, id: e.target.value })}
              className="h-8 font-mono text-xs bg-background"
              placeholder="monetag-multitag, adsense-300x250…"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Source / Network
            </Label>
            <Input
              value={unit.source ?? ""}
              onChange={(e) => onChange({ ...unit, source: e.target.value })}
              className="h-8 text-xs bg-background"
              placeholder="monetag, adcash, mgid, adsense…"
            />
          </div>
        </div>

        {/* Row 3: Ad Markup */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Code2 className="size-3 text-primary" />
              Ad Markup
            </Label>
            <span className="font-mono text-[10px] text-muted-foreground">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          </div>
          <Textarea
            value={unit.content ?? ""}
            onChange={(e) => onChange({ ...unit, content: e.target.value })}
            className="h-28 min-h-20 max-h-52 resize-y font-mono text-xs leading-relaxed bg-zinc-950 text-zinc-100 border-zinc-800 placeholder:text-zinc-600 focus-visible:ring-primary/40"
            placeholder={'<script src="https://..." async></script>\n<!-- or paste ad unit HTML here -->'}
          />
        </div>
      </div>
    </div>
  )
}

export function AdsPlacementsEditor({
  origin,
  placementKey,
  onChange,
}: {
  origin: OriginDocument
  placementKey: AdPlacementKey
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const info = PLACEMENT_INFO[placementKey]
  const adsScript: OriginAdsScript = origin.ads?.adsScript ?? {}

  const updateScript = (patcher: (curr: OriginAdsScript) => OriginAdsScript) => {
    onChange((prev) => {
      const current = prev.ads?.adsScript ?? {}
      return {
        ...prev,
        ads: {
          ...(prev.ads ?? {}),
          adsScript: patcher(current),
        },
      }
    })
  }

  // ─── SINGLETON (beforePost, afterPost, adsVideoHeader) ───────────────────
  if (info.isSingleton) {
    let currentSlot: OriginAdUnit | null | undefined = null
    if (placementKey === "beforePost") currentSlot = adsScript.adsBody?.beforePost
    else if (placementKey === "afterPost") currentSlot = adsScript.adsBody?.afterPost
    else if (placementKey === "adsVideoHeader") currentSlot = adsScript.adsVideoHeader

    const isSlotConfigured = Boolean(currentSlot)

    const handleCreateSlot = () => {
      const newSlot: OriginAdUnit = {
        id: `${info.prefix}-${crypto.randomUUID().slice(0, 6)}`,
        source: "",
        content: "",
        enabled: true,
      }
      updateScript((curr) => {
        if (placementKey === "beforePost") {
          return { ...curr, adsBody: { ...(curr.adsBody ?? {}), beforePost: newSlot } }
        }
        if (placementKey === "afterPost") {
          return { ...curr, adsBody: { ...(curr.adsBody ?? {}), afterPost: newSlot } }
        }
        return { ...curr, adsVideoHeader: newSlot }
      })
      toast.success(`${info.title} slot created`)
    }

    const handleUpdateSlot = (updated: OriginAdUnit) => {
      updateScript((curr) => {
        if (placementKey === "beforePost") {
          return { ...curr, adsBody: { ...(curr.adsBody ?? {}), beforePost: updated } }
        }
        if (placementKey === "afterPost") {
          return { ...curr, adsBody: { ...(curr.adsBody ?? {}), afterPost: updated } }
        }
        return { ...curr, adsVideoHeader: updated }
      })
    }

    const handleRemoveSlot = () => {
      updateScript((curr) => {
        if (placementKey === "beforePost") {
          return { ...curr, adsBody: { ...(curr.adsBody ?? {}), beforePost: null } }
        }
        if (placementKey === "afterPost") {
          return { ...curr, adsBody: { ...(curr.adsBody ?? {}), afterPost: null } }
        }
        return { ...curr, adsVideoHeader: null }
      })
      toast.info(`${info.title} slot removed`)
    }

    return (
      <div className="space-y-4">
        {isSlotConfigured && currentSlot ? (
          <AdUnitCard
            unit={currentSlot}
            onChange={handleUpdateSlot}
            onRemove={handleRemoveSlot}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center space-y-3">
            <Code2 className="size-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No slot configured for this placement.</p>
            <Button type="button" variant="outline" onClick={handleCreateSlot} size="sm">
              <Plus className="size-3.5" />
              Add Unit
            </Button>
          </div>
        )}
      </div>
    )
  }

  // ─── ARRAY PLACEMENTS (adsHeader, adsFooter, adsLeftSidebar, adsRightSidebar, inPost) ───
  let units: OriginAdUnit[] = []
  if (placementKey === "adsHeader") units = adsScript.adsHeader ?? []
  else if (placementKey === "adsFooter") units = adsScript.adsFooter ?? []
  else if (placementKey === "adsLeftSidebar") units = adsScript.adsLeftSidebar ?? []
  else if (placementKey === "adsRightSidebar") units = adsScript.adsRightSidebar ?? []
  else if (placementKey === "inPost") units = adsScript.adsBody?.inPost ?? []

  const setUnits = (nextList: OriginAdUnit[]) => {
    updateScript((curr) => {
      if (placementKey === "inPost") {
        return { ...curr, adsBody: { ...(curr.adsBody ?? {}), inPost: nextList } }
      }
      return { ...curr, [placementKey]: nextList }
    })
  }

  const handleAddUnit = () => {
    const newUnit: OriginAdUnit = {
      id: `${info.prefix}-${crypto.randomUUID().slice(0, 6)}`,
      source: "",
      content: "",
      enabled: true,
    }
    setUnits([...units, newUnit])
    toast.success("New ad unit added")
  }

  const handleDuplicate = (idx: number) => {
    const clone: OriginAdUnit = {
      ...units[idx],
      id: `${units[idx].id || info.prefix}-copy-${crypto.randomUUID().slice(0, 4)}`,
    }
    setUnits([...units.slice(0, idx + 1), clone, ...units.slice(idx + 1)])
    toast.success("Ad unit duplicated")
  }

  const handleUpdateUnit = (idx: number, updated: OriginAdUnit) => {
    setUnits(units.map((u, i) => (i === idx ? updated : u)))
  }

  const handleRemoveUnit = (idx: number) => {
    setUnits(units.filter((_, i) => i !== idx))
    toast.info("Ad unit removed")
  }

  const handleMove = (idx: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= units.length) return
    const next = [...units]
    ;[next[idx], next[targetIdx]] = [next[targetIdx], next[idx]]
    setUnits(next)
  }

  return (
    <div className="space-y-4">
      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center space-y-3">
          <Code2 className="size-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No ad units in this placement.</p>
          <Button type="button" variant="outline" onClick={handleAddUnit} size="sm">
            <Plus className="size-3.5" />
            Add First Unit
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {units.map((unit, idx) => (
            <AdUnitCard
              key={idx}
              unit={unit}
              index={idx}
              totalUnits={units.length}
              onChange={(updated) => handleUpdateUnit(idx, updated)}
              onDuplicate={() => handleDuplicate(idx)}
              onRemove={() => handleRemoveUnit(idx)}
              onMoveUp={() => handleMove(idx, "up")}
              onMoveDown={() => handleMove(idx, "down")}
            />
          ))}
        </div>
      )}
    </div>
  )
}

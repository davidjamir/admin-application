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

const PLACEMENT_INFO: Record<
  AdPlacementKey,
  { title: string; prefix: string; isSingleton: boolean }
> = {
  adsHeader: {
    title: "Header Ads (adsHeader)",
    prefix: "ads-header",
    isSingleton: false,
  },
  adsFooter: {
    title: "Footer Ads (adsFooter)",
    prefix: "ads-footer",
    isSingleton: false,
  },
  adsLeftSidebar: {
    title: "Left Sidebar Ads (adsLeftSidebar)",
    prefix: "ads-left",
    isSingleton: false,
  },
  adsRightSidebar: {
    title: "Right Sidebar Ads (adsRightSidebar)",
    prefix: "ads-right",
    isSingleton: false,
  },
  inPost: {
    title: "In-Post Ads (adsBody.inPost)",
    prefix: "ads-in-post",
    isSingleton: false,
  },
  beforePost: {
    title: "Before Post (adsBody.beforePost)",
    prefix: "before-post",
    isSingleton: true,
  },
  afterPost: {
    title: "After Post (adsBody.afterPost)",
    prefix: "after-post",
    isSingleton: true,
  },
  adsVideoHeader: {
    title: "Video Header (adsVideoHeader)",
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
}: {
  unit: OriginAdUnit
  index?: number
  totalUnits?: number
  onChange: (updated: OriginAdUnit) => void
  onDuplicate?: () => void
  onRemove?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const lineCount = unit.content ? unit.content.split("\n").length : 0

  const handleCopy = () => {
    navigator.clipboard.writeText(unit.content || "")
    setCopied(true)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`relative rounded-lg border overflow-hidden transition-all ${
        unit.enabled
          ? "border-emerald-500/30 bg-card"
          : "border-border bg-muted/30"
      }`}
    >
      {/* Left accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          unit.enabled ? "bg-emerald-500" : "bg-muted-foreground/25"
        }`}
      />

      <div className="pl-4 pr-3 py-3 space-y-3">
        {/* Row 1: Status + Index + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onChange({ ...unit, enabled: !unit.enabled })}
              className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                unit.enabled
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 border"
              }`}
            >
              <Power className="size-3" />
              {unit.enabled ? "ON" : "OFF"}
            </button>
            {typeof index === "number" && (
              <span className="font-mono text-[11px] text-muted-foreground">
                #{index + 1}{totalUnits ? ` / ${totalUnits}` : ""}
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5">
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

        {/* Row 2: ID + Source inline */}
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              ID
            </Label>
            <Input
              value={unit.id}
              onChange={(e) => onChange({ ...unit, id: e.target.value })}
              className="h-8 font-mono text-xs bg-background"
              placeholder="monetag-multitag"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Source
            </Label>
            <Input
              value={unit.source}
              onChange={(e) => onChange({ ...unit, source: e.target.value })}
              className="h-8 text-xs bg-background"
              placeholder="monetag, adcash, mgid"
            />
          </div>
        </div>

        {/* Row 3: Code editor */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Code2 className="size-3 text-primary" />
              Ad Markup
            </Label>
            <span className="font-mono text-[10px] text-muted-foreground">
              {lineCount} lines
            </span>
          </div>
          <Textarea
            value={unit.content}
            onChange={(e) => onChange({ ...unit, content: e.target.value })}
            className="h-28 min-h-20 max-h-52 resize-y font-mono text-xs leading-relaxed bg-zinc-950 text-zinc-100 border-zinc-800 placeholder:text-zinc-600 focus-visible:ring-primary/40"
            placeholder={'<script src="https://..." async></script>'}
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

  // Handle Singleton Placements (beforePost, afterPost, adsVideoHeader)
  if (info.isSingleton) {
    let currentSlot: OriginAdUnit | null | undefined = null
    if (placementKey === "beforePost") currentSlot = adsScript.adsBody?.beforePost
    else if (placementKey === "afterPost") currentSlot = adsScript.adsBody?.afterPost
    else if (placementKey === "adsVideoHeader") currentSlot = adsScript.adsVideoHeader

    const isSlotConfigured =
      currentSlot &&
      (currentSlot.id !== "" || currentSlot.source !== "" || currentSlot.content !== "")

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{info.title}</h3>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
              SINGLE SLOT
            </span>
          </div>
          {!isSlotConfigured && (
            <Button type="button" onClick={handleCreateSlot} size="sm">
              <Plus className="size-3.5" />
              Configure
            </Button>
          )}
        </div>

        {isSlotConfigured && currentSlot ? (
          <AdUnitCard
            unit={currentSlot}
            onChange={handleUpdateSlot}
            onRemove={handleRemoveSlot}
          />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center space-y-3">
            <p className="text-xs text-muted-foreground">No slot configured for this placement.</p>
            <Button type="button" variant="outline" onClick={handleCreateSlot} size="sm">
              <Plus className="size-3.5" />
              Add Slot
            </Button>
          </div>
        )}
      </div>
    )
  }

  // Handle Array Placements (adsHeader, adsFooter, adsLeftSidebar, adsRightSidebar, inPost)
  let units: OriginAdUnit[] = []
  if (placementKey === "adsHeader") units = adsScript.adsHeader ?? []
  else if (placementKey === "adsFooter") units = adsScript.adsFooter ?? []
  else if (placementKey === "adsLeftSidebar") units = adsScript.adsLeftSidebar ?? []
  else if (placementKey === "adsRightSidebar") units = adsScript.adsRightSidebar ?? []
  else if (placementKey === "inPost") units = adsScript.adsBody?.inPost ?? []

  const handleAddUnit = () => {
    const newUnit: OriginAdUnit = {
      id: `${info.prefix}-${crypto.randomUUID().slice(0, 6)}`,
      source: "",
      content: "",
      enabled: true,
    }
    const nextList = [...units, newUnit]

    updateScript((curr) => {
      if (placementKey === "inPost") {
        return { ...curr, adsBody: { ...(curr.adsBody ?? {}), inPost: nextList } }
      }
      return { ...curr, [placementKey]: nextList }
    })
    toast.success("New ad unit added")
  }

  const handleDuplicate = (idx: number) => {
    const sourceUnit = units[idx]
    const clone: OriginAdUnit = {
      ...sourceUnit,
      id: `${sourceUnit.id || info.prefix}-copy-${crypto.randomUUID().slice(0, 4)}`,
    }
    const nextList = [...units.slice(0, idx + 1), clone, ...units.slice(idx + 1)]

    updateScript((curr) => {
      if (placementKey === "inPost") {
        return { ...curr, adsBody: { ...(curr.adsBody ?? {}), inPost: nextList } }
      }
      return { ...curr, [placementKey]: nextList }
    })
    toast.success("Ad unit duplicated")
  }

  const handleUpdateUnit = (idx: number, updated: OriginAdUnit) => {
    const nextList = units.map((u, i) => (i === idx ? updated : u))
    updateScript((curr) => {
      if (placementKey === "inPost") {
        return { ...curr, adsBody: { ...(curr.adsBody ?? {}), inPost: nextList } }
      }
      return { ...curr, [placementKey]: nextList }
    })
  }

  const handleRemoveUnit = (idx: number) => {
    const nextList = units.filter((_, i) => i !== idx)
    updateScript((curr) => {
      if (placementKey === "inPost") {
        return { ...curr, adsBody: { ...(curr.adsBody ?? {}), inPost: nextList } }
      }
      return { ...curr, [placementKey]: nextList }
    })
    toast.info("Ad unit removed")
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{info.title}</h3>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            {units.length} {units.length === 1 ? "unit" : "units"}
          </span>
        </div>
        <Button type="button" onClick={handleAddUnit} size="sm">
          <Plus className="size-3.5" />
          Add Unit
        </Button>
      </div>

      {units.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center space-y-3">
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
              key={`${unit.id}-${idx}`}
              unit={unit}
              index={idx}
              totalUnits={units.length}
              onChange={(updated) => handleUpdateUnit(idx, updated)}
              onDuplicate={() => handleDuplicate(idx)}
              onRemove={() => handleRemoveUnit(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

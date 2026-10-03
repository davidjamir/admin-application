"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { OriginDocument, OriginScript } from "@/types/origin"
import {
  Plus,
  Trash2,
  Power,
  Copy,
  Check,
  ArrowUp,
  ArrowDown,
  Code2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

const CROSS_ORIGIN_OPTIONS = [
  { value: "anonymous", label: "anonymous" },
  { value: "use-credentials", label: "use-credentials" },
]

const STRATEGY_OPTIONS = [
  { value: "beforeInteractive", label: "beforeInteractive" },
  { value: "afterInteractive", label: "afterInteractive" },
  { value: "lazyOnload", label: "lazyOnload" },
  { value: "worker", label: "worker" },
]

function ScriptCard({
  script,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  script: OriginScript
  index: number
  total: number
  onChange: (updated: OriginScript) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [copied, setCopied] = useState(false)
  const isFirst = index === 0
  const isLast = index === total - 1

  const handleCopy = () => {
    navigator.clipboard.writeText(script.src)
    setCopied(true)
    toast.success("Script URL copied")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSrcChange = (val: string) => {
    const trimmed = val.trim()
    if (trimmed.startsWith("<script") && trimmed.includes("src=")) {
      const srcMatch = trimmed.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        const extractedSrc = srcMatch[1]
        const hasAsync = /\basync\b/i.test(trimmed)
        const hasDefer = /\bdefer\b/i.test(trimmed)
        const crossOriginMatch = trimmed.match(/crossorigin=["']([^"']+)["']/i)
        const crossOrigin = crossOriginMatch ? crossOriginMatch[1] : undefined

        onChange({
          ...script,
          src: extractedSrc,
          async: hasAsync ? true : script.async,
          defer: hasDefer ? true : script.defer,
          crossOrigin: crossOrigin ?? script.crossOrigin,
        })
        toast.success("Auto-extracted URL and attributes from <script> tag")
        return
      }
    }
    onChange({ ...script, src: val })
  }

  return (
    <div
      className={`rounded-lg border transition-all duration-200 ${
        script.enabled
          ? "border-emerald-500/30 bg-card"
          : "border-destructive/25 bg-card"
      }`}
    >
      <div className="px-4 py-3 space-y-3">

        {/* ── Row 1: Toggle + Index | Reorder + Actions ── */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...script, enabled: !script.enabled })}
              className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-all duration-200 ${
                script.enabled
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : "bg-destructive text-white hover:bg-destructive/80"
              }`}
            >
              <Power className="size-3" />
              {script.enabled ? "Enabled" : "Disabled"}
            </button>
            <span className="font-mono text-[11px] text-muted-foreground">
              #{index + 1}/{total}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move up"
              className={`flex size-7 items-center justify-center rounded-md border text-sm transition-colors ${
                isFirst
                  ? "border-border/40 text-muted-foreground/30 cursor-not-allowed"
                  : "border-border bg-muted/30 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
              }`}
            >
              <ArrowUp className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={isLast}
              title="Move down"
              className={`flex size-7 items-center justify-center rounded-md border text-sm transition-colors ${
                isLast
                  ? "border-border/40 text-muted-foreground/30 cursor-not-allowed"
                  : "border-border bg-muted/30 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
              }`}
            >
              <ArrowDown className="size-3.5" />
            </button>

            <div className="w-px h-5 bg-border mx-0.5" />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="size-7 text-muted-foreground hover:text-foreground"
              title="Copy URL"
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="size-7 text-destructive hover:bg-destructive/10"
              title="Delete script"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {/* ── Row 2: ID (flex-1) + Flags + crossOrigin + Strategy — one full-width row ── */}
        <div className="flex items-end gap-2">
          {/* ID — takes the majority of the row */}
          <div className="space-y-1 flex-1 min-w-0">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              ID
            </Label>
            <Input
              value={script.id ?? ""}
              onChange={(e) => onChange({ ...script, id: e.target.value })}
              className="h-8 w-full font-mono text-xs bg-background"
              placeholder="gtm-main, adsense-1…"
            />
          </div>

          {/* Flags — async + defer checkboxes */}
          <div className="space-y-1 shrink-0">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Flags
            </Label>
            <div className="flex items-center gap-3 h-8">
              <label className="flex cursor-pointer items-center gap-1.5">
                <Checkbox
                  checked={Boolean(script.async)}
                  onCheckedChange={(val) => onChange({ ...script, async: val === true })}
                />
                <span className="font-mono text-xs text-foreground">async</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <Checkbox
                  checked={Boolean(script.defer)}
                  onCheckedChange={(val) => onChange({ ...script, defer: val === true })}
                />
                <span className="font-mono text-xs text-foreground">defer</span>
              </label>
            </div>
          </div>

          {/* crossOrigin */}
          <div className="space-y-1 w-36 shrink-0">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              crossOrigin
            </Label>
            <Select
              value={script.crossOrigin ?? "__none__"}
              onValueChange={(val) =>
                onChange({ ...script, crossOrigin: val === "__none__" ? undefined : val })
              }
            >
              <SelectTrigger className="h-8 text-xs font-mono">
                <SelectValue placeholder="— none —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="font-mono text-xs text-muted-foreground">
                  — none —
                </SelectItem>
                {CROSS_ORIGIN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-mono text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Strategy */}
          <div className="space-y-1 w-44 shrink-0">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Strategy
            </Label>
            <Select
              value={script.strategy ?? "__none__"}
              onValueChange={(val) =>
                onChange({ ...script, strategy: val === "__none__" ? undefined : val })
              }
            >
              <SelectTrigger className="h-8 text-xs font-mono">
                <SelectValue placeholder="— none —" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__" className="font-mono text-xs text-muted-foreground">
                  — none —
                </SelectItem>
                {STRATEGY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="font-mono text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Row 3: URL — full width ── */}
        <div className="space-y-1">
          <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            <Code2 className="size-3 text-primary" />
            URL (src)
          </Label>
          <Input
            value={script.src}
            onChange={(e) => handleSrcChange(e.target.value)}
            className="h-8 font-mono text-xs bg-background w-full"
            placeholder="https://cdn.example.com/script.js"
          />
        </div>

      </div>
    </div>
  )
}


export function HeadScriptsEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const scripts = origin.script ?? []

  const handleAddScript = () => {
    const newScript: OriginScript = {
      id: `script-${crypto.randomUUID().slice(0, 6)}`,
      src: "",
      async: true,
      defer: false,
      crossOrigin: "anonymous",
      strategy: "afterInteractive",
      enabled: true,
    }
    onChange((prev) => ({
      ...prev,
      script: [...(prev.script ?? []), newScript],
    }))
    toast.success("Script added")
  }

  const handleUpdate = (idx: number, updated: OriginScript) => {
    onChange((prev) => {
      const list = [...(prev.script ?? [])]
      list[idx] = updated
      return { ...prev, script: list }
    })
  }

  const handleRemove = (idx: number) => {
    onChange((prev) => ({
      ...prev,
      script: (prev.script ?? []).filter((_, i) => i !== idx),
    }))
    toast.info("Script removed")
  }

  const handleMove = (idx: number, direction: "up" | "down") => {
    onChange((prev) => {
      const list = [...(prev.script ?? [])]
      const targetIdx = direction === "up" ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= list.length) return prev
      ;[list[idx], list[targetIdx]] = [list[targetIdx], list[idx]]
      return { ...prev, script: list }
    })
  }

  return (
    <div className="space-y-4">
      {scripts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center space-y-3">
          <Code2 className="size-8 mx-auto text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">No head scripts configured.</p>
          <Button type="button" variant="outline" onClick={handleAddScript} size="sm">
            <Plus className="size-3.5" />
            Add First Script
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {scripts.map((script, idx) => (
            <ScriptCard
              key={idx}
              script={script}
              index={idx}
              total={scripts.length}
              onChange={(updated) => handleUpdate(idx, updated)}
              onRemove={() => handleRemove(idx)}
              onMoveUp={() => handleMove(idx, "up")}
              onMoveDown={() => handleMove(idx, "down")}
            />
          ))}
        </div>
      )}
    </div>
  )
}

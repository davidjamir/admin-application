"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OriginDocument, OriginScript } from "@/types/origin"
import { Plus, Trash2, Power, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

function ScriptCard({
  script,
  index,
  onChange,
  onRemove,
}: {
  script: OriginScript
  index: number
  onChange: (updated: OriginScript) => void
  onRemove: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(script.src)
    setCopied(true)
    toast.success("Script URL copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...script, enabled: !script.enabled })}
            className={`inline-flex h-6 items-center gap-1 rounded px-2 text-[11px] font-semibold transition-all ${
              script.enabled
                ? "bg-emerald-600 text-white"
                : "bg-muted text-muted-foreground border"
            }`}
          >
            <Power className="size-3" />
            <span>{script.enabled ? "ON" : "OFF"}</span>
          </button>
          <span className="font-mono text-xs text-muted-foreground">#{index + 1}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-[11px] font-semibold text-muted-foreground">ID</Label>
          <Input
            value={script.id}
            onChange={(e) => onChange({ ...script, id: e.target.value })}
            className="h-8 font-mono text-xs"
            placeholder="adsense-1"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <Label className="text-[11px] font-semibold text-muted-foreground">URL (src)</Label>
          <Input
            value={script.src}
            onChange={(e) => onChange({ ...script, src: e.target.value })}
            className="h-8 font-mono text-xs"
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
        <label className="flex cursor-pointer items-center gap-1.5">
          <Checkbox
            checked={Boolean(script.async)}
            onCheckedChange={(val) => onChange({ ...script, async: val === true })}
          />
          <span className="font-mono text-[11px]">async</span>
        </label>

        <label className="flex cursor-pointer items-center gap-1.5">
          <Checkbox
            checked={Boolean(script.defer)}
            onCheckedChange={(val) => onChange({ ...script, defer: val === true })}
          />
          <span className="font-mono text-[11px]">defer</span>
        </label>

        <div className="flex items-center gap-1.5 ml-auto">
          <Input
            value={script.crossOrigin ?? ""}
            onChange={(e) => onChange({ ...script, crossOrigin: e.target.value })}
            className="h-7 w-28 text-xs font-mono"
            placeholder="crossOrigin"
          />
          <Input
            value={script.strategy ?? ""}
            onChange={(e) => onChange({ ...script, strategy: e.target.value })}
            className="h-7 w-32 text-xs font-mono"
            placeholder="strategy"
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {scripts.length} Injected Scripts
        </span>
        <Button type="button" onClick={handleAddScript} size="sm">
          <Plus className="size-4" />
          Add Script
        </Button>
      </div>

      {scripts.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
          No head scripts configured.
        </div>
      ) : (
        <div className="space-y-3">
          {scripts.map((script, idx) => (
            <ScriptCard
              key={`${script.id}-${idx}`}
              script={script}
              index={idx}
              onChange={(updated) => handleUpdate(idx, updated)}
              onRemove={() => handleRemove(idx)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

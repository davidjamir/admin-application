"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OriginDocument } from "@/types/origin"
import { Globe, Image as ImageIcon, Sparkles } from "lucide-react"

export function IdentityEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Domain</Label>
          <div className="relative">
            <Globe className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={origin.origin}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, origin: e.target.value }))
              }
              className="pl-9 font-medium"
              placeholder="example.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Total Items</Label>
          <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-xs font-mono font-medium">
            {origin.totalItems?.toLocaleString() ?? 0}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground">Favicon URL</Label>
            {origin.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={origin.icon}
                alt="Icon preview"
                className="size-5 rounded border bg-background object-contain p-0.5"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            ) : null}
          </div>
          <div className="relative">
            <ImageIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={origin.icon ?? ""}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, icon: e.target.value }))
              }
              className="pl-9 font-mono text-xs"
              placeholder="https://.../favicon.png"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground">Logo URL</Label>
            {origin.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={origin.logo}
                alt="Logo preview"
                className="h-5 max-w-20 rounded border bg-background object-contain p-0.5"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            ) : null}
          </div>
          <div className="relative">
            <Sparkles className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={origin.logo ?? ""}
              onChange={(e) =>
                onChange((prev) => ({ ...prev, logo: e.target.value }))
              }
              className="pl-9 font-mono text-xs"
              placeholder="https://.../logo.png"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
        <div className="grid grid-cols-2 gap-2 font-mono sm:grid-cols-4">
          <div><span className="text-foreground/70">ID:</span> {origin._id}</div>
          <div><span className="text-foreground/70">Created:</span> {origin.createdAt ? new Date(origin.createdAt).toLocaleDateString() : "—"}</div>
          <div><span className="text-foreground/70">Updated:</span> {origin.updatedAt ? new Date(origin.updatedAt).toLocaleDateString() : "—"}</div>
          <div><span className="text-foreground/70">Ads:</span> {origin.config?.enabledAds ? "Enabled" : "Disabled"}</div>
        </div>
      </div>
    </div>
  )
}

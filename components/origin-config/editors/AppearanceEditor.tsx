"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import type { OriginDocument } from "@/types/origin"

export function AppearanceEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const config = origin.config ?? {}

  const updateConfig = (partial: Partial<NonNullable<OriginDocument["config"]>>) => {
    onChange((prev) => ({
      ...prev,
      config: {
        ...(prev.config ?? {}),
        ...partial,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Colors Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Header Color (colorHeader)</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.colorHeader && config.colorHeader.startsWith("#") ? config.colorHeader : "#ffffff"}
              onChange={(e) => updateConfig({ colorHeader: e.target.value })}
              className="size-8 cursor-pointer rounded border p-0.5 bg-background shadow-xs shrink-0"
            />
            <Input
              value={config.colorHeader ?? ""}
              onChange={(e) => updateConfig({ colorHeader: e.target.value })}
              placeholder="transparent or #ffffff"
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Header Text Color (colorTextHeader)</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.colorTextHeader && config.colorTextHeader.startsWith("#") ? config.colorTextHeader : "#000000"}
              onChange={(e) => updateConfig({ colorTextHeader: e.target.value })}
              className="size-8 cursor-pointer rounded border p-0.5 bg-background shadow-xs shrink-0"
            />
            <Input
              value={config.colorTextHeader ?? ""}
              onChange={(e) => updateConfig({ colorTextHeader: e.target.value })}
              placeholder="black or #000000"
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Primary Color (primaryColor)</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.primaryColor && config.primaryColor.startsWith("#") ? config.primaryColor : "#E10600"}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="size-8 cursor-pointer rounded border p-0.5 bg-background shadow-xs shrink-0"
            />
            <Input
              value={config.primaryColor ?? ""}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              placeholder="#E10600"
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground">Accent Color (accentColor)</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.accentColor && config.accentColor.startsWith("#") ? config.accentColor : "#FFFFFF"}
              onChange={(e) => updateConfig({ accentColor: e.target.value })}
              className="size-8 cursor-pointer rounded border p-0.5 bg-background shadow-xs shrink-0"
            />
            <Input
              value={config.accentColor ?? ""}
              onChange={(e) => updateConfig({ accentColor: e.target.value })}
              placeholder="#FFFFFF"
              className="font-mono text-xs"
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="border-t pt-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors">
            <span className="text-xs font-semibold">Enable Ads</span>
            <Checkbox
              checked={Boolean(config.enabledAds)}
              onCheckedChange={(val) => updateConfig({ enabledAds: val === true })}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors">
            <span className="text-xs font-semibold">Breadcrumb</span>
            <Checkbox
              checked={Boolean(config.visibledBreadcrumb)}
              onCheckedChange={(val) => updateConfig({ visibledBreadcrumb: val === true })}
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-muted/40 transition-colors">
            <span className="text-xs font-semibold">Custom OpenGraph</span>
            <Checkbox
              checked={Boolean(config.customOpengraphImage)}
              onCheckedChange={(val) => updateConfig({ customOpengraphImage: val === true })}
            />
          </label>
        </div>
      </div>
    </div>
  )
}

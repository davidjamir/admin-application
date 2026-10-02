"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { OriginDocument } from "@/types/origin"
import { Globe } from "lucide-react"

export function SeoEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const seo = origin.seo ?? {}
  const title = seo.title ?? ""
  const description = seo.description ?? ""

  const updateSeo = (partial: Partial<NonNullable<OriginDocument["seo"]>>) => {
    onChange((prev) => ({
      ...prev,
      seo: {
        ...(prev.seo ?? {}),
        ...partial,
      },
    }))
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground">SEO Title</Label>
            <span
              className={`font-mono text-[11px] ${
                title.length > 60 ? "text-amber-500 font-semibold" : "text-muted-foreground"
              }`}
            >
              {title.length} / 60
            </span>
          </div>
          <Input
            value={title}
            onChange={(e) => updateSeo({ title: e.target.value })}
            placeholder="Site title"
            className="text-sm font-medium"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-muted-foreground">SEO Description</Label>
            <span
              className={`font-mono text-[11px] ${
                description.length > 160 ? "text-amber-500 font-semibold" : "text-muted-foreground"
              }`}
            >
              {description.length} / 160
            </span>
          </div>
          <Textarea
            value={description}
            onChange={(e) => updateSeo({ description: e.target.value })}
            placeholder="Meta description"
            className="h-24 resize-y text-xs leading-relaxed"
          />
        </div>
      </div>

      {/* Google Preview */}
      <div className="rounded-lg border bg-card p-4 space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Google Search Snippet Preview
        </span>

        <div className="rounded border bg-background p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {origin.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={origin.icon}
                alt="icon"
                className="size-3.5 rounded-full object-contain"
                onError={(e) => {
                  ;(e.target as HTMLElement).style.display = "none"
                }}
              />
            ) : (
              <Globe className="size-3 text-muted-foreground" />
            )}
            <span className="text-foreground/80 font-medium">{origin.origin}</span>
            <span className="text-[11px] text-muted-foreground truncate">https://{origin.origin}</span>
          </div>

          <div className="text-sm font-medium text-blue-600 dark:text-blue-400 line-clamp-1">
            {title || origin.origin}
          </div>

          <p className="text-xs text-foreground/80 line-clamp-2 leading-relaxed">
            {description || "No description configured."}
          </p>
        </div>
      </div>
    </div>
  )
}

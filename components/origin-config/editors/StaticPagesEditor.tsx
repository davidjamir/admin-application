"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OriginDocument, OriginStaticPage } from "@/types/origin"
import { Plus, Trash2, Layers } from "lucide-react"
import { toast } from "sonner"

export function StaticPagesEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const pages = origin.pages ?? []

  const handleAddPage = () => {
    const nextId = String(pages.length + 1)
    const newPage: OriginStaticPage = {
      id: nextId,
      name: "",
      slug: "/page/",
    }
    onChange((prev) => ({
      ...prev,
      pages: [...(prev.pages ?? []), newPage],
    }))
    toast.success("New static page added")
  }

  const handleUpdate = (index: number, updated: OriginStaticPage) => {
    onChange((prev) => {
      const list = [...(prev.pages ?? [])]
      list[index] = updated
      return { ...prev, pages: list }
    })
  }

  const handleRemove = (index: number) => {
    onChange((prev) => ({
      ...prev,
      pages: (prev.pages ?? []).filter((_, i) => i !== index),
    }))
    toast.info("Page removed")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/30 p-4">
        <div>
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Layers className="size-4 text-primary" />
            Static Pages ({pages.length})
          </h4>
          <p className="text-xs text-muted-foreground">
            Essential legal and information pages (Privacy Policy, Terms of Service, Contact Us, Disclaimer).
          </p>
        </div>
        <Button type="button" onClick={handleAddPage} size="sm">
          <Plus className="size-4" />
          Add Static Page
        </Button>
      </div>

      {pages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-card/40 space-y-3">
          <p className="text-sm text-muted-foreground">No static pages defined.</p>
          <Button type="button" variant="outline" onClick={handleAddPage} size="sm">
            <Plus className="size-4" />
            Add First Page
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden grid-cols-[90px_1fr_1fr_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
            <span>ID</span>
            <span>Page Name</span>
            <span>Path (Slug)</span>
            <span>Action</span>
          </div>

          {pages.map((page, idx) => (
            <div
              key={`${page.id}-${idx}`}
              className="grid gap-2.5 rounded-xl border bg-card p-3 sm:grid-cols-[90px_1fr_1fr_auto] sm:items-center sm:p-2.5 shadow-2xs"
            >
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground sm:hidden">ID</Label>
                <Input
                  value={page.id}
                  onChange={(e) => handleUpdate(idx, { ...page, id: e.target.value })}
                  placeholder="1, 2..."
                  className="h-8 font-mono text-xs bg-background"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase text-muted-foreground sm:hidden">Page Name</Label>
                <Input
                  value={page.name}
                  onChange={(e) => handleUpdate(idx, { ...page, name: e.target.value })}
                  placeholder="Privacy Policy"
                  className="h-8 text-xs font-medium bg-background"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase text-muted-foreground sm:hidden">Slug</Label>
                <Input
                  value={page.slug}
                  onChange={(e) => handleUpdate(idx, { ...page, slug: e.target.value })}
                  placeholder="/page/privacy-policy"
                  className="h-8 font-mono text-xs text-muted-foreground focus:text-foreground bg-background"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(idx)}
                  className="h-8 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                  <span className="sm:hidden ml-1">Delete</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

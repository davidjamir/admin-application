"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OriginCategory, OriginDocument } from "@/types/origin"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

export function CategoriesEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const categories = origin.categories ?? []

  const handleAddCategory = () => {
    const nextId = categories.length + 1
    const newCat: OriginCategory = {
      id: nextId,
      name: "",
      slug: "/category/",
    }
    onChange((prev) => ({
      ...prev,
      categories: [...(prev.categories ?? []), newCat],
    }))
    toast.success("New category added")
  }

  const handleUpdate = (index: number, updated: OriginCategory) => {
    onChange((prev) => {
      const list = [...(prev.categories ?? [])]
      list[index] = updated
      return { ...prev, categories: list }
    })
  }

  const handleRemove = (index: number) => {
    onChange((prev) => ({
      ...prev,
      categories: (prev.categories ?? []).filter((_, i) => i !== index),
    }))
    toast.info("Category removed")
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-card/40 space-y-3">
          <p className="text-sm text-muted-foreground">No categories defined yet.</p>
          <Button type="button" variant="outline" onClick={handleAddCategory} size="sm">
            <Plus className="size-4" />
            Add First Category
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="hidden grid-cols-[90px_1fr_1fr_auto] gap-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
            <span>ID</span>
            <span>Category Name</span>
            <span>Category Slug</span>
            <span>Action</span>
          </div>

          {categories.map((cat, idx) => (
            <div
              key={idx}
              className="grid gap-2.5 rounded-xl border bg-card p-3 sm:grid-cols-[90px_1fr_1fr_auto] sm:items-center sm:p-2.5 shadow-2xs"
            >
              <div>
                <Label className="text-[10px] uppercase text-muted-foreground sm:hidden">ID</Label>
                <Input
                  value={String(cat.id)}
                  onChange={(e) => {
                    const raw = e.target.value
                    const id = /^\d+$/.test(raw) ? Number(raw) : raw
                    handleUpdate(idx, { ...cat, id })
                  }}
                  placeholder="1, 2..."
                  className="h-8 font-mono text-xs bg-background"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase text-muted-foreground sm:hidden">Category Name</Label>
                <Input
                  value={cat.name}
                  onChange={(e) => handleUpdate(idx, { ...cat, name: e.target.value })}
                  placeholder="Sports, News, Entertainment..."
                  className="h-8 text-xs font-medium bg-background"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase text-muted-foreground sm:hidden">Slug</Label>
                <Input
                  value={cat.slug}
                  onChange={(e) => handleUpdate(idx, { ...cat, slug: e.target.value })}
                  placeholder="/category/sports"
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

import React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FieldProps {
  value: string
  onChange: (val: string) => void
}

export function AboutField({ value, onChange }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="about" className="text-[13px] font-semibold text-muted-foreground/80">About</Label>
      <Textarea id="about" value={value || ""} onChange={(e) => onChange(e.target.value)}
        placeholder="About page..." className="min-h-[60px] px-3 py-2 rounded-lg bg-background/50 text-sm resize-none" rows={2} />
    </div>
  )
}

export function DescriptionField({ value, onChange }: FieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="text-[13px] font-semibold text-muted-foreground/80">Description</Label>
      <Textarea id="description" value={value || ""} onChange={(e) => onChange(e.target.value)}
        placeholder="Description..." className="min-h-[120px] px-3 py-2 rounded-lg bg-background/50 text-sm resize-none" />
    </div>
  )
}

import React from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface AboutDescriptionFieldsProps {
  about: string
  setAbout: (val: string) => void
  description: string
  setDescription: (val: string) => void
}

export function AboutDescriptionFields({
  about, setAbout, description, setDescription
}: AboutDescriptionFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="about" className="text-[13px] font-semibold text-muted-foreground/80">About</Label>
        <Textarea id="about" value={about || ""} onChange={(e) => setAbout(e.target.value)}
          placeholder="About page..." className="min-h-[100px] px-3 py-2 rounded-lg bg-background/50 text-sm resize-none" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[13px] font-semibold text-muted-foreground/80">Description</Label>
        <Textarea id="description" value={description || ""} onChange={(e) => setDescription(e.target.value)}
          placeholder="Description..." className="min-h-[120px] px-3 py-2 rounded-lg bg-background/50 text-sm resize-none" />
      </div>
    </>
  )
}

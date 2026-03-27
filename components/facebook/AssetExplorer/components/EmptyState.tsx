import React from "react"
import { Layers } from "lucide-react"

interface EmptyStateProps {
  mode: string
}

export function EmptyState({ mode }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-4 text-center px-8">
      <div className="p-3 bg-muted rounded-full mb-3 opacity-20">
        <Layers className="w-8 h-8" />
      </div>
      <div className="max-w-xs space-y-1">
        <h3 className="text-sm text-black font-normal capitalize">No pages found</h3>
        <p className="text-[10px] tracking-tight leading-relaxed text-black/40">
           {mode === "System User" ? "Select a system user to discover assets." : "Establish an identity link to begin."}
        </p>
      </div>
    </div>
  )
}

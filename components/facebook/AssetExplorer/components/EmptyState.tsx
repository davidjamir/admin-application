import React from "react"
import { Layers } from "lucide-react"

interface EmptyStateProps {
  mode: string
}

export function EmptyState({ mode }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center px-8">
      <div className="p-5 bg-muted rounded-full mb-6 opacity-20">
        <Layers className="w-16 h-16" />
      </div>
      <div className="max-w-xs space-y-2">
        <h3 className="text-sm text-black font-normal capitalize">No pages found for this {mode === "System User" ? "system user" : "account"}</h3>
        <p className="text-[10px] tracking-tight leading-relaxed text-black/40">
           {mode === "System User" ? "Select a validated identity node to discover assets linked via System User protocol." : "Establish an identity link to begin crawler protocol."}
        </p>
      </div>
    </div>
  )
}

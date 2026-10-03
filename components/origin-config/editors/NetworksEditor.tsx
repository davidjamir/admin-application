"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { OriginDocument } from "@/types/origin"
import { Plus, X, Network } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function NetworksEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const [newKey, setNewKey] = useState("")
  const networks = origin.networks ?? []

  const handleAdd = () => {
    const trimmed = newKey.trim()
    if (!trimmed) return
    if (networks.includes(trimmed)) {
      toast.error("Network key already exists")
      return
    }
    onChange((prev) => ({
      ...prev,
      networks: [...(prev.networks ?? []), trimmed],
    }))
    setNewKey("")
    toast.success(`Network "${trimmed}" added`)
  }

  const handleRemove = (keyToRemove: string) => {
    onChange((prev) => ({
      ...prev,
      networks: (prev.networks ?? []).filter((k) => k !== keyToRemove),
    }))
  }

  return (
    <div className="space-y-4">
      {/* Input to add network */}
      <div className="flex items-center gap-2">
        <Input
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Enter network key (e.g. sports-group, tier1-network)"
          className="flex-1 text-xs font-mono"
        />
        <Button type="button" onClick={handleAdd} size="sm" className="ml-auto shrink-0">
          <Plus className="size-4" />
          Add Network
        </Button>
      </div>

      {/* Network Tags List */}
      <div className="rounded-lg border bg-card p-4">
        {networks.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            No networks linked to this origin.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {networks.map((netKey) => (
              <span
                key={netKey}
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 font-mono text-xs font-medium text-foreground"
              >
                <Network className="size-3 text-muted-foreground" />
                <span>{netKey}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(netKey)}
                  className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                  title="Remove network"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

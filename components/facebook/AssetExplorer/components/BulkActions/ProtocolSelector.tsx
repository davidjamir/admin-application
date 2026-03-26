import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, UserMinus, Share2, Plus, Trash2 } from "lucide-react"
import { ActionType } from "@/hooks/useBulkActions"

interface ProtocolSelectorProps {
  action: ActionType
  setAction: (val: ActionType) => void
}

export function ProtocolSelector({ action, setAction }: ProtocolSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold tracking-widest text-muted-foreground ml-1">Protocol Type</label>
      <Select value={action} onValueChange={(v) => setAction(v as ActionType)}>
        <SelectTrigger className="h-10 bg-background/50 border-border/50 text-sm font-bold text-black">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="assign-user-current-bm" className="text-sm">
            <div className="flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> Assign to User</div>
          </SelectItem>
          <SelectItem value="remove-user-current-bm" className="text-xs">
            <div className="flex items-center gap-2"><UserMinus className="w-3.5 h-3.5" /> Remove from User</div>
          </SelectItem>
          <SelectItem value="share-other-bm" className="text-xs">
            <div className="flex items-center gap-2"><Share2 className="w-3.5 h-3.5" /> Share to other BM</div>
          </SelectItem>
          <SelectItem value="add-current-bm" className="text-xs">
            <div className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Add to current BM</div>
          </SelectItem>
          <SelectItem value="remove-page-current-bm" className="text-xs text-destructive">
            <div className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Remove asset from BM</div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

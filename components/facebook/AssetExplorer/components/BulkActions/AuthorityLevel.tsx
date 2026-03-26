import React from "react"
import { Button } from "@/components/ui/button"
import { ActionType } from "@/hooks/useBulkActions"

interface AuthorityLevelProps {
  action: ActionType
  taskMode: "basic" | "full"
  setTaskMode: (mode: "basic" | "full") => void
}

export function AuthorityLevel({ action, taskMode, setTaskMode }: AuthorityLevelProps) {
  if (!["assign-user-current-bm", "share-other-bm"].includes(action)) return null

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-bold tracking-tight text-black ml-1">Authority Level</label>
      <div className="flex gap-2">
        <Button 
          size="sm" 
          variant={taskMode === "basic" ? "default" : "outline"}
          onClick={() => setTaskMode("basic")}
          className="flex-1 h-9 text-sm font-bold"
        >Basic Access</Button>
        <Button 
          size="sm" 
          variant={taskMode === "full" ? "default" : "outline"}
          onClick={() => setTaskMode("full")}
          className="flex-1 h-9 text-sm font-bold"
        >Full Hierarchy</Button>
      </div>
    </div>
  )
}

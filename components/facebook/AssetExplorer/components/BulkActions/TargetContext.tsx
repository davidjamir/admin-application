import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FacebookBusiness, SystemUser } from "@/types/facebook"
import { ActionType } from "@/hooks/useBulkActions"

interface TargetContextProps {
  action: ActionType
  targetBmId: string
  setTargetBmId: (val: string) => void
  businesses: FacebookBusiness[]
  targetSystemUserId: string
  setTargetSystemUserId: (val: string) => void
  systemUsers: SystemUser[]
}

export function TargetContext({
  action, targetBmId, setTargetBmId, businesses,
  targetSystemUserId, setTargetSystemUserId, systemUsers
}: TargetContextProps) {
  const showBmSelect = ["assign-user-current-bm", "add-current-bm", "remove-page-current-bm", "remove-user-current-bm", "share-other-bm"].includes(action)
  const showUserSelect = ["assign-user-current-bm", "remove-user-current-bm"].includes(action)

  if (!showBmSelect && !showUserSelect) return null

  return (
    <div className="space-y-3 p-4 bg-muted/30 border border-border/40 rounded-xl">
      {showBmSelect && (
        <div className="space-y-1.5">
          <label className="text-sm font-bold tracking-tight text-black ml-1">Target Business (Context)</label>
          <Select value={targetBmId} onValueChange={setTargetBmId}>
            <SelectTrigger className="h-11 bg-background/50 border-border/50 text-sm">
              <SelectValue placeholder="Select BM..." />
            </SelectTrigger>
            <SelectContent>
              {businesses.map(bm => <SelectItem key={bm.id} value={bm.id} className="text-sm">{bm.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {showUserSelect && (
        <div className="space-y-1.5">
          <label className="text-sm font-bold tracking-tight text-black ml-1">Target Identity (User)</label>
          <Select value={targetSystemUserId} onValueChange={setTargetSystemUserId}>
            <SelectTrigger className="h-11 bg-background/50 border-border/50 text-sm font-bold text-black">
              <SelectValue placeholder="Select User..." />
            </SelectTrigger>
            <SelectContent>
              {systemUsers.filter(u => (u.status || "Active") === "Active").map(u => (
                 <SelectItem key={u.id} value={u.id} className="text-sm font-bold text-black">
                   {u.name} • {u.businessName || "No BM"}
                 </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}

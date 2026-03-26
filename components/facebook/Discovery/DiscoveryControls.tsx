import React from "react"
import { Search, Database, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DiscoveryControlsProps } from "./types"

export const DiscoveryControls: React.FC<DiscoveryControlsProps> = ({
  isAdminVerified, systemUsers, selectedSystemUserId, setSelectedSystemUserId,
  selectedUser, handlePageSave, saving, loadingPages, pagesCount, selectedPageIdsCount
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_160px] gap-3">
      <Select 
        value={selectedSystemUserId} 
        onValueChange={setSelectedSystemUserId} 
        disabled={!isAdminVerified || systemUsers.length === 0}
      >
        <SelectTrigger className="h-10 bg-background/50 border-border/50 text-black">
          <SelectValue placeholder="Select Identity..." />
        </SelectTrigger>
        <SelectContent>
          {systemUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              <div className="flex flex-col items-start py-0.5">
                <span className="text-xs font-bold">{user.name}</span>
                <span className="text-[9px] text-muted-foreground font-mono opacity-60">
                  {user.businessName || "Unknown BM"}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-primary/50 transition-colors">
          <Search className="w-4 h-4" />
        </div>
        <div className="pl-9 pr-4 py-2 text-xs font-medium text-muted-foreground border border-border/50 rounded-md bg-muted/20 flex items-center h-10 italic">
          {selectedUser ? `${selectedUser.name} identity active for discovery` : "Await identity selection..."}
        </div>
      </div>

      <Button 
        onClick={handlePageSave} 
        disabled={!isAdminVerified || saving || loadingPages || pagesCount === 0 || selectedPageIdsCount === 0}
        className="w-full h-10 cursor-pointer shadow-lg shadow-primary/5 font-bold"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
        {saving ? "Ingesting..." : "Ingest Tokens"}
      </Button>
    </div>
  )
}

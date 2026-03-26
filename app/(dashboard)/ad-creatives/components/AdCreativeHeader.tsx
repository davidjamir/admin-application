import React from "react"
import { Clock, ImagePlay, Plus, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { AdCreativeHeaderProps } from "./types"

export const AdCreativeHeader: React.FC<AdCreativeHeaderProps> = ({
  fetchedAt, refreshing, fetchData, onAddOpen
}) => {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ImagePlay className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-black">Ad Creatives</h1>
        </div>
        {fetchedAt && (
          <p className="text-xs text-muted-foreground ml-[52px] italic flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            Cached Sync: <span suppressHydrationWarning>{new Date(fetchedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })}</span>
            <button 
              disabled={refreshing}
              onClick={async () => { 
                const id = toast.warning("Recrawling...", { duration: Infinity }); 
                await fetchData(true); 
                toast.success("Refreshed", { id }) 
              }} 
              className={`cursor-pointer transition-colors ${refreshing ? "text-green-600" : "hover:text-foreground"}`}
            >
              <RefreshCcw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            </button>
          </p>
        )}
      </div>
      <button
        onClick={onAddOpen}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
      >
        <Plus className="w-4 h-4" /> Add Creative
      </button>
    </div>
  )
}

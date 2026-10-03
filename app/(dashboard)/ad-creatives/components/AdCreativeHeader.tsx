import React from "react"
import { Clock, ImagePlay, Plus, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { AdCreativeHeaderProps } from "./types"

export const AdCreativeHeader: React.FC<AdCreativeHeaderProps> = ({
  fetchedAt, refreshing, fetchData, onAddOpen
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            <ImagePlay className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Ad Creatives</h1>
            {fetchedAt && (
              <p className="text-xs text-muted-foreground mt-0.5 italic flex items-center gap-1.5">
                <Clock className="size-3" />
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
                  <RefreshCcw className={`size-3 ${refreshing ? "animate-spin" : ""}`} />
                </button>
              </p>
            )}
          </div>
        </div>
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

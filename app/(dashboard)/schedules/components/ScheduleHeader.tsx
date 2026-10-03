import React from "react"
import { Calendar, Loader2, RefreshCcw } from "lucide-react"
import { ScheduleHeaderProps } from "./types"
import { CustomProgress } from "./CustomProgress"

export const ScheduleHeader: React.FC<ScheduleHeaderProps> = ({
  lastSyncTime, isRefreshing, loading, fetchData, nextSyncProgress
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-4 px-1 shrink-0 text-foreground">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
          <Calendar className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Schedules Manager</h1>
          <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl">
            Universal posting calendar and content asset pipelines. Real-time background nodes are monitoring and distributing your content.
          </p>
        </div>
      </div>
      
      <div className="inline-flex flex-col items-end gap-3 w-auto self-end">
        <div className="flex items-center gap-3 whitespace-nowrap">
           <span className="text-[10px] italic text-muted-foreground/60">
             Last sync: {new Date(lastSyncTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </span>
           <button 
              onClick={() => fetchData(true)}
              disabled={isRefreshing || loading}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border transition-all disabled:opacity-50 group shadow-sm shrink-0 cursor-pointer ${isRefreshing || loading ? "border-green-600 bg-green-50/50 dark:bg-green-950/30" : "bg-card border-border hover:bg-muted text-black dark:text-white"}`}
              title="Force Resync"
            >
              <div className="flex items-center gap-2 pr-2.5 border-r border-border">
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-tight">Live</span>
              </div>
              {isRefreshing || loading ? (
                <Loader2 className="size-3.5 animate-spin text-green-600" />
              ) : (
                <RefreshCcw className="size-3.5 text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
              )}
           </button>
        </div>
        
        <div className="flex flex-col w-full">
          <div className="flex justify-between items-center mb-1.5 px-1">
             <span className="text-[10px] text-muted-foreground/50 font-medium">Next Sync</span>
             <span className="text-[10px] font-bold tabular-nums text-black dark:text-white">{Math.max(0, Math.floor(60 * (1 - nextSyncProgress / 100)))}s</span>
          </div>
          <CustomProgress value={nextSyncProgress} />
        </div>
      </div>
    </div>
  )
}

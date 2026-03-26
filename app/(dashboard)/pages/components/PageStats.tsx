import React from "react"
import { RefreshCcw } from "lucide-react"
import { PageStatsProps } from "./types"

export const PageStats: React.FC<PageStatsProps> = ({
  fetchedAt, handleRefresh, loading
}) => {
  return (
    <div className="flex justify-end items-center gap-2 mb-4 mt-2">
      {fetchedAt && (
        <span className="text-xs text-muted-foreground italic">
          Data synced: {new Date(fetchedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })}
        </span>
      )}
      <button 
        onClick={handleRefresh} 
        disabled={loading}
        className={`p-1.5 rounded-sm transition-colors disabled:opacity-50 cursor-pointer ${loading ? "border-green-600 text-green-600 border bg-green-50/50" : "bg-muted/50 hover:bg-muted text-muted-foreground"}`}
        title="Force Recrawl"
      >
        <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  )
}

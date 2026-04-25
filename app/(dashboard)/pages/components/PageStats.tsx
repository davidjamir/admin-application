import React from "react"
import { RefreshCcw } from "lucide-react"
import { PageStatsProps } from "./types"

export const PageStats: React.FC<PageStatsProps> = ({
  fetchedAt, handleRefresh, pageCount, categoryFilter, searchQuery
}) => {
  const filterLabel = categoryFilter === "All" ? "All categories" : categoryFilter
  const hasSearch = searchQuery.trim().length > 0
  const countLabel = pageCount?.toLocaleString("en-US")
  const searchLabel = hasSearch ? ` matching search "${searchQuery.trim()}"` : ""

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 mt-2">
      {pageCount !== null && (
        <div className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold tabular-nums text-black">{countLabel}</span>{" "}
          <span>{pageCount === 1 ? "page" : "pages"}</span> in{" "}
          <span className="font-medium text-black">{filterLabel}</span>
          {searchLabel}
        </div>
      )}

      <div className="flex justify-end items-center gap-2 sm:ml-auto">
        {fetchedAt && (
          <span className="text-xs text-muted-foreground italic">
            Last data synced: {new Date(fetchedAt).toLocaleDateString("en-US", {
              timeZone: "Asia/Ho_Chi_Minh",
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            })}
          </span>
        )}
        <button 
          onClick={handleRefresh} 
          className="p-1.5 rounded-sm transition-colors cursor-pointer bg-muted/50 hover:bg-muted text-muted-foreground"
          title="Force Recrawl"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

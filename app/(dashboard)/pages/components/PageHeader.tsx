import React from "react"
import { Search, Layers } from "lucide-react"
import { PageHeaderProps } from "./types"

export const PageHeader: React.FC<PageHeaderProps> = ({
  searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, availableCategories
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
          <Layers className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Pages Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor satellite pages and automated traffic-pulling schedules.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search page, category or topic..."
            className="flex h-9 w-full rounded-md border border-input bg-card px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            className="flex h-9 w-full sm:w-[160px] rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer text-foreground"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {availableCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All Categories" : cat}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

import React from "react"
import { Filter, Search } from "lucide-react"
import { PageHeaderProps } from "./types"

export const PageHeader: React.FC<PageHeaderProps> = ({
  searchQuery, setSearchQuery, categoryFilter, setCategoryFilter, availableCategories
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">Pages Management</h1>
        <p className="text-muted-foreground mt-2">
          Monitor satellite pages and automated traffic-pulling schedules.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search page, category or topic..."
            className="flex h-9 w-full rounded-md border border-input bg-card px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-black"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
          <select
            className="flex h-9 w-full sm:w-[160px] rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer text-black"
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

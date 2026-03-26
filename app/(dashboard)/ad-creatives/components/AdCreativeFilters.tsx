import React from "react"
import { Search } from "lucide-react"
import { AdCreativeFiltersProps } from "./types"

export const AdCreativeFilters: React.FC<AdCreativeFiltersProps> = ({
  search, setSearch, sourceFilter, setSourceFilter,
  domainFilter, setDomainFilter, enabledFilter, setEnabledFilter,
  sources, domainsInUI
}) => {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search name, domain, source..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border bg-card text-sm text-black focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <select
          value={sourceFilter}
          onChange={e => setSourceFilter(e.target.value)}
          className="w-[160px] px-2 py-2 rounded-lg border bg-card text-sm text-black font-normal focus:outline-none cursor-pointer shadow-sm"
        >
          {sources.map(s => <option key={s} value={s}>{s === "all" ? "All Sources" : s}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={domainFilter}
          onChange={e => setDomainFilter(e.target.value)}
          className="w-[160px] px-2 py-2 rounded-lg border bg-card text-sm text-black font-normal focus:outline-none cursor-pointer shadow-sm"
        >
          {domainsInUI.map(d => <option key={d} value={d}>{d === "all" ? "All Domains" : d}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={enabledFilter}
          onChange={e => setEnabledFilter(e.target.value as "all" | "enabled" | "disabled")}
          className="w-[160px] px-2 py-2 rounded-lg border bg-card text-sm text-black font-normal focus:outline-none cursor-pointer shadow-sm"
        >
          <option value="all">All Status</option>
          <option value="enabled">Enabled</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>
    </div>
  )
}

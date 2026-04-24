import React from "react"
import { Search } from "lucide-react"
import { TabFiltersProps } from "./types"

export const TabFilters: React.FC<TabFiltersProps> = ({
    tab, search, setSearch, originFilter, setOriginFilter, originList,
    channelFilter, setChannelFilter, channelList,
    wrapChannelFilter, setWrapChannelFilter, wrapChannelList,
    quotaChannelFilter, setQuotaChannelFilter, quotaChannelList,
    statusFilter, setStatusFilter,
    dateFilter, setDateFilter, dateList, todayStr
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-3 items-center mt-4">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={`Search ${tab}...`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
                />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {tab === "quotas" && dateFilter && setDateFilter && dateList && (
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className="px-2 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 min-w-[150px] shadow-sm"
                        >
                            {dateList.map(d => {
                                let label = d === "all" ? "All Days" : d.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
                                if (d === todayStr) label = "Today"
                                return <option key={d} value={d}>{label}</option>
                            })}
                        </select>
                    </div>
                )}
                {tab === "blogs" && statusFilter && setStatusFilter && (
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-2 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 w-[140px] shadow-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                        </select>
                    </div>
                )}
                {tab === "blogs" && channelFilter && setChannelFilter && channelList && (
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={channelFilter}
                            onChange={e => setChannelFilter(e.target.value)}
                            className="px-2 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 w-[180px] shadow-sm"
                        >
                            {channelList.map(c => (
                                <option key={c} value={c}>{c === "all" ? "All Channels" : c}</option>
                            ))}
                        </select>
                    </div>
                )}
                {tab === "wraps" && wrapChannelFilter !== undefined && setWrapChannelFilter && wrapChannelList && (
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={wrapChannelFilter}
                            onChange={e => setWrapChannelFilter(e.target.value)}
                            className="px-2 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 w-[180px] shadow-sm"
                        >
                            {wrapChannelList.map(c => (
                                <option key={c} value={c}>{c === "all" ? "All Channels" : c}</option>
                            ))}
                        </select>
                    </div>
                )}
                {tab === "quotas" && quotaChannelFilter !== undefined && setQuotaChannelFilter && quotaChannelList && (
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={quotaChannelFilter}
                            onChange={e => setQuotaChannelFilter(e.target.value)}
                            className="px-2 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 w-[180px] shadow-sm"
                        >
                            {quotaChannelList.map(c => (
                                <option key={c} value={c}>{c === "all" ? "All Channels" : c}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex items-center gap-2 shrink-0">
                    <select
                        value={originFilter}
                        onChange={e => setOriginFilter(e.target.value)}
                        className="px-2 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 w-[180px] shadow-sm"
                    >
                        {originList.map(o => (
                            <option key={o} value={o}>{o === "all" ? "All Origins" : o}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    )
}

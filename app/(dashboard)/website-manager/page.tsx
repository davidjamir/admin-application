"use client"

import { RefreshCcw } from "lucide-react"
import { Blog, Wrap, QuotaGroup, useWebsiteManager } from "@/hooks/useWebsiteManager"
import { WebsiteHeader } from "@/components/website-manager/WebsiteHeader"
import { WebsiteStats } from "@/components/website-manager/WebsiteStats"
import { OriginStatsChart } from "@/components/website-manager/OriginStatsChart"
import { NavigationTabs } from "@/components/website-manager/NavigationTabs"
import { TabFilters } from "@/components/website-manager/TabFilters"
import { BlogsTable } from "@/components/website-manager/BlogsTable"
import { WrapsTable } from "@/components/website-manager/WrapsTable"
import { QuotasTable } from "@/components/website-manager/QuotasTable"
import { DetailsPanel } from "@/components/website-manager/DetailsPanel"

export default function WebsiteManagerPage() {
    const {
        loading, refreshing, fetchedAt, tab, setTab,
        search, setSearch, originFilter, setOriginFilter, channelFilter, setChannelFilter,
        dateFilter, setDateFilter, selected, setSelected, mounted, fetchData, copyToClipboard,
        filteredBlogs, filteredWraps, filteredGroups, allOriginNames, allDates, originHistory,
        counts, filteredCounts, originList, allChannels, todayStr
    } = useWebsiteManager()

    if (!mounted) {
        return (
            <div className="flex flex-col gap-5 p-6 h-full items-center justify-center min-h-[400px]">
                <RefreshCcw className="w-8 h-8 text-green-600 animate-spin opacity-20" />
                <p className="text-xs text-muted-foreground animate-pulse">Initializing dashboard...</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-5 p-6 h-full" suppressHydrationWarning>
            {selected && (
                <div className="fixed inset-0 z-30 bg-background/50 backdrop-blur-[2px] animate-in fade-in"
                    onClick={() => setSelected(null)} />
            )}

            <WebsiteHeader
                fetchedAt={fetchedAt}
                onRefresh={() => void fetchData(true)}
                refreshing={refreshing}
                fetchData={fetchData}
            />

            <WebsiteStats
                loading={loading}
                tab={tab}
                setTab={setTab}
                setSearch={setSearch}
                counts={counts}
            />

            <OriginStatsChart
                loading={loading}
                originHistory={originHistory}
                allOriginNames={allOriginNames}
                originFilter={originFilter}
                setOriginFilter={setOriginFilter}
            />

            <NavigationTabs
                tab={tab}
                setTab={setTab}
                setSearch={setSearch}
                counts={filteredCounts}
                loading={loading}
            />

            <TabFilters
                tab={tab}
                search={search}
                setSearch={setSearch}
                originFilter={originFilter}
                setOriginFilter={setOriginFilter}
                originList={originList}
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                channelList={allChannels}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                dateList={["all", ...allDates]}
                todayStr={todayStr}
            />

            {tab === "blogs" && (
                <BlogsTable
                    loading={loading}
                    blogs={filteredBlogs}
                    selectedId={selected?.tab === "blogs" ? (selected.data as Blog)._id : undefined}
                    onSelect={setSelected}
                />
            )}
            {tab === "wraps" && (
                <WrapsTable
                    loading={loading}
                    wraps={filteredWraps}
                    selectedId={selected?.tab === "wraps" ? (selected.data as Wrap)._id : undefined}
                    onSelect={setSelected}
                />
            )}
            {tab === "quotas" && (
                <QuotasTable
                    loading={loading}
                    quotas={filteredGroups}
                    selectedId={selected?.tab === "quotas" ? (selected.data as QuotaGroup).domain : undefined}
                    onSelect={setSelected}
                />
            )}

            <DetailsPanel
                selected={selected}
                onClose={() => setSelected(null)}
                onCopy={copyToClipboard}
                allDates={allDates}
                dateFilter={dateFilter}
            />
        </div>
    )
}

"use client"

import { LoadingScreen } from "@/components/ui/loading-screen"
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
        wrapChannelFilter, setWrapChannelFilter, quotaChannelFilter, setQuotaChannelFilter,
        statusFilter, setStatusFilter, dateFilter, setDateFilter, selected, setSelected,
        mounted, fetchData, copyToClipboard, filteredBlogs, filteredWraps, filteredGroups,
        allOriginNames, allDates, originHistory, counts, filteredCounts, originList,
        allChannels, allWrapChannels, allQuotaChannels, wrapChannelMap, quotaChannelMap, todayStr
    } = useWebsiteManager()

    if (!mounted || loading) {
        return (
            <LoadingScreen />
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
                tab={tab}
                setTab={setTab}
                setSearch={setSearch}
                counts={counts}
            />

            <OriginStatsChart
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
                wrapChannelFilter={wrapChannelFilter}
                setWrapChannelFilter={setWrapChannelFilter}
                wrapChannelList={allWrapChannels}
                quotaChannelFilter={quotaChannelFilter}
                setQuotaChannelFilter={setQuotaChannelFilter}
                quotaChannelList={allQuotaChannels}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                dateList={["all", ...allDates]}
                todayStr={todayStr}
            />

            {tab === "blogs" && (
                <BlogsTable
                    blogs={filteredBlogs}
                    selectedId={selected?.tab === "blogs" ? (selected.data as Blog)._id : undefined}
                    onSelect={setSelected}
                />
            )}
            {tab === "wraps" && (
                <WrapsTable
                    wraps={filteredWraps}
                    selectedId={selected?.tab === "wraps" ? (selected.data as Wrap)._id : undefined}
                    onSelect={setSelected}
                    channelMap={wrapChannelMap}
                />
            )}
            {tab === "quotas" && (
                <QuotasTable
                    quotas={filteredGroups}
                    selectedId={selected?.tab === "quotas" ? (selected.data as QuotaGroup).domain : undefined}
                    onSelect={setSelected}
                    channelMap={quotaChannelMap}
                />
            )}

            <DetailsPanel
                selected={selected}
                onClose={() => setSelected(null)}
                onCopy={copyToClipboard}
                allDates={allDates}
                dateFilter={dateFilter}
                wrapChannelMap={wrapChannelMap}
                quotaChannelMap={quotaChannelMap}
            />
        </div>
    )
}

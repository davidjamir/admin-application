"use client"

import { Database, Newspaper, Share2 } from "lucide-react"
import { useQueues } from "@/hooks/useQueues"
import { ScheduleHeader } from "./components/ScheduleHeader"
import { QueueSection } from "./components/QueueSection"

export default function SchedulesPage() {
  const {
    data,
    loading,
    isRefreshing,
    nextSyncProgress,
    lastSyncTime,
    fetchData,
    handleCopyId
  } = useQueues()

  return (
    <div className="flex flex-col gap-8 h-[calc(100vh-100px)] overflow-hidden">
      <ScheduleHeader 
        lastSyncTime={lastSyncTime}
        isRefreshing={isRefreshing}
        loading={loading}
        fetchData={fetchData}
        nextSyncProgress={nextSyncProgress}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch flex-1 overflow-hidden min-h-0 pb-4">
        {/* CRAWL QUEUE */}
        <QueueSection 
          title="Crawl Queue"
          items={data?.crawlQueue}
          stats={data?.stats?.crawl}
          loading={loading}
          icon={<Database className="size-4 text-indigo-500" />}
          onCopy={handleCopyId}
          type="crawl"
        />

        {/* NEWS QUEUE */}
        <QueueSection 
          title="News Queue"
          items={data?.newsQueue}
          stats={data?.stats?.news}
          loading={loading}
          icon={<Newspaper className="size-4 text-emerald-500" />}
          onCopy={handleCopyId}
          type="news"
        />

        {/* SOCIAL QUEUE */}
        <QueueSection 
          title="Social Queue"
          items={data?.socialQueue}
          stats={data?.stats?.social}
          loading={loading}
          icon={<Share2 className="size-4 text-amber-500" />}
          onCopy={handleCopyId}
          type="social"
        />
      </div>
    </div>
  )
}

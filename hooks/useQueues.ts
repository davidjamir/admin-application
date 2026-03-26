import { useEffect, useState, useCallback, useRef } from "react"
import { toast } from "sonner"

export interface QueueItem {
  _id: string
  itemId: string
  createdAt: string
  type?: string
  failCount?: number
  page?: string
  scheduleAt?: number
  status?: string
  updatedAt?: string | number | Date
}

export interface QueuesData {
  crawlQueue: QueueItem[]
  newsQueue: QueueItem[]
  socialQueue: QueueItem[]
  stats?: {
    crawl: { total: number; types: Record<string, number>; fails: number }
    news: { total: number }
    social: { total: number; pages: number }
  }
  fetchedAt: number
}

export function useQueues() {
  const [data, setData] = useState<QueuesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [nextSyncProgress, setNextSyncProgress] = useState(100)
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now())
  
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async (isForced = false) => {
    if (isForced) setIsRefreshing(true)
    else setLoading(true)
    
    try {
      const url = isForced ? `/api/queues?force=true&t=${Date.now()}` : "/api/queues"
      const res = await fetch(url)
      const json = await res.json()
      
      if (res.ok) {
        setData(json)
        setLastSyncTime(Date.now())
        setNextSyncProgress(0)
        if (isForced) toast.success("Manual Node Resync Complete")
      } else {
        throw new Error(json.error || "Failed to fetch")
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("Failed to fetch queues", err)
      toast.error("Database Connection Refused", {
        description: "Protocol ECONNREFUSED when reaching Atlas Cluster.",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const pollInterval = 60000;
    const updateFreq = 1000;

    progressIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        setNextSyncProgress(prev => {
          if (prev >= 100) {
            fetchData();
            return 0;
          }
          return prev + (100 / (pollInterval / updateFreq));
        });
      }
    }, updateFreq);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    };
  }, [fetchData])

  const handleCopyId = useCallback((id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Protocol ID Copied", { duration: 800 })
  }, [])

  return {
    data,
    loading,
    isRefreshing,
    nextSyncProgress,
    lastSyncTime,
    fetchData,
    handleCopyId
  }
}

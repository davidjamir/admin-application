import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"

export interface MongoPageData {
  _id: { $oid: string }
  pageId: string
  appName: string
  category: string
  topic?: string
  createdAt: { $date: string }
  name: string
  source: string
  systemUserId: string
  systemUserName: string
  token: string
  updatedAt: { $date: string }
  lastScheduledAt: number 
  lastScheduledViralAt?: number
  lastActionAt: number
  contentPreview?: string
  queueCount?: number
  trafficInterval?: number
  viralInterval?: number
  defaultTitle?: string
}

export interface PageDetails {
  _id: string
  stats: { today: number; tomorrow: number; later: number }
  queue: Array<{ id: string; content: string; scheduledAt: number; createdAt?: number }>
  history: Array<{ id: string; content: string; postedAt: number; status: string }>
  cachedAt?: number
}

export function useFacebookPages() {
  const [data, setData] = useState<MongoPageData[]>([])
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [appliedCategoryFilter, setAppliedCategoryFilter] = useState("All")
  const [appliedSearchQuery, setAppliedSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [availableCategories, setAvailableCategories] = useState<string[]>(["All"])
  const [searchQuery, setSearchQuery] = useState("")
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  
  // Slide Over state
  const [selectedPage, setSelectedPage] = useState<MongoPageData | null>(null)
  const [details, setDetails] = useState<PageDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"queue" | "history">("queue")
  const [showToken, setShowToken] = useState(false)

  const fetchData = useCallback(async (forceRecrawl = false) => {
    setLoading(true)
    setTotalPages(null)
    try {
      const requestedCategoryFilter = categoryFilter
      const requestedSearchQuery = searchQuery
      const url = new URL("/api/pages", window.location.origin)
      if (requestedCategoryFilter !== "All") url.searchParams.append("category", requestedCategoryFilter)
      if (requestedSearchQuery) url.searchParams.append("search", requestedSearchQuery)
      if (forceRecrawl) url.searchParams.append("forceRecrawl", "true")

      const res = await fetch(url.toString())
      const json = await res.json()
      const pages = Array.isArray(json.data) ? json.data : []
      setData(pages)
      setTotalPages(typeof json.total === "number" ? json.total : pages.length)
      setAppliedCategoryFilter(requestedCategoryFilter)
      setAppliedSearchQuery(requestedSearchQuery)
      
      // Update available categories when viewing all
      if (categoryFilter === "All" && !searchQuery) {
        const uniqueCats = Array.from(new Set(pages.map((p: MongoPageData) => p.topic).filter(Boolean))) as string[]
        setAvailableCategories(["All", ...uniqueCats.sort()])
      }

      if (json.fetchedAt) setFetchedAt(json.fetchedAt)
    } catch (error) {
      console.error("Failed to fetch pages", error)
      toast.error("Failed to fetch pages")
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, searchQuery])

  useEffect(() => {
    setTotalPages(null)
    const timeoutId = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timeoutId)
  }, [fetchData])

  const handleRefresh = useCallback(() => fetchData(true), [fetchData])

  const handlePageClick = useCallback(async (page: MongoPageData) => {
    setSelectedPage(page)
    setDetails(null)
    setDetailsLoading(true)
    setShowToken(false)
    setActiveTab("queue")

    try {
      const res = await fetch(`/api/pages/${page._id.$oid}`)
      const json = await res.json()
      setDetails(json)
    } catch(err) {
      console.error(err)
      toast.error("Failed to fetch page details")
    } finally {
      setDetailsLoading(false)
    }
  }, [])

  const formatExactRelative = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return null
    const diffMs = timestamp - Date.now()
    
    const isPast = diffMs < 0
    const absMs = Math.abs(diffMs)
    
    const days = Math.floor(absMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60))
    
    let timeStr = ""
    if (days > 0) timeStr += `${days}d `
    if (hours > 0) timeStr += `${hours}h `
    timeStr += `${minutes}m`

    if (days === 0 && hours === 0 && minutes === 0) return "Exceeds: 0m"
    return `Exceeds: ${isPast ? '-' : ''}${timeStr.trim()}`
  }

  const getHealthColor = (timestamp: number) => {
    if (!timestamp || timestamp <= 0) return 'hsl(0, 0%, 35%)'
    
    const nowMs = Date.now()
    const diffMs = timestamp - nowMs
    
    // Check Calendar Match in GMT+7
    const getHCMDateStr = (ts: number) => {
      const date = new Date(ts)
      return date.toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    }
    
    const isToday = getHCMDateStr(nowMs) === getHCMDateStr(timestamp)
    const isPast = diffMs < 0
    const absDays = Math.abs(diffMs / 86400000)
    
    if (isToday) {
      if (isPast) {
        const lightness = Math.max(30, 48 - (absDays * 10)) 
        return `hsl(45, 100%, ${lightness}%)`
      } else {
        const lightness = Math.max(30, 45 - (absDays * 15)) 
        return `hsl(120, 90%, ${lightness}%)`
      }
    } else {
      if (isPast) {
        const lightness = Math.max(25, 48 - (absDays * 2))
        return `hsl(275, 95%, ${lightness}%)`
      } else {
        const lightness = Math.max(25, 45 - (absDays * 2))
        return `hsl(0, 95%, ${lightness}%)`
      }
    }
  }

  const getLatestScheduledAt = (page: Pick<MongoPageData, "lastScheduledAt" | "lastScheduledViralAt">) => {
    const trafficScheduledAt = Number(page.lastScheduledAt) || 0
    const viralScheduledAt = Number(page.lastScheduledViralAt) || 0
    return Math.max(trafficScheduledAt, viralScheduledAt)
  }

  return {
    data, totalPages, appliedCategoryFilter, appliedSearchQuery,
    loading, categoryFilter, setCategoryFilter,
    availableCategories, searchQuery, setSearchQuery, fetchedAt,
    selectedPage, setSelectedPage, details, setDetails, detailsLoading,
    activeTab, setActiveTab, showToken, setShowToken,
    handleRefresh, handlePageClick, formatExactRelative, getHealthColor, getLatestScheduledAt
  }
}

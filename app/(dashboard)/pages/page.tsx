"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Search, Filter, Clock, LayoutGrid, X, LayoutDashboard, History, CalendarClock, RefreshCcw, Copy } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
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
  lastActionAt: number
  contentPreview?: string
  queueCount?: number
}

interface PageDetails {
  _id: string
  stats: { today: number; tomorrow: number; later: number }
  queue: Array<{ id: string; content: string; scheduledAt: number }>
  history: Array<{ id: string; content: string; postedAt: number; status: string }>
  cachedAt?: number
}

export default function PagesManagementPage() {
  const [data, setData] = useState<MongoPageData[]>([])
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

  // categories is now managed via availableCategories state

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const url = new URL("/api/pages", window.location.origin)
        if (categoryFilter !== "All") url.searchParams.append("category", categoryFilter)
        if (searchQuery) url.searchParams.append("search", searchQuery)

        const res = await fetch(url.toString())
        const json = await res.json()
        setData(json.data)
        
        // Update available categories when viewing all
        if (categoryFilter === "All" && !searchQuery && json.data) {
          const uniqueCats = Array.from(new Set(json.data.map((p: MongoPageData) => p.category).filter(Boolean))) as string[]
          setAvailableCategories(["All", ...uniqueCats.sort()])
        }

        if (json.fetchedAt) setFetchedAt(json.fetchedAt)
      } catch (error) {
        console.error("Failed to fetch pages", error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(() => fetchData(), 300)
    return () => clearTimeout(timeoutId)
  }, [categoryFilter, searchQuery])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const url = new URL("/api/pages", window.location.origin)
      if (categoryFilter !== "All") url.searchParams.append("category", categoryFilter)
      if (searchQuery) url.searchParams.append("search", searchQuery)
      url.searchParams.append("forceRecrawl", "true")

      const res = await fetch(url.toString())
      const json = await res.json()
      setData(json.data)
      if (json.fetchedAt) setFetchedAt(json.fetchedAt)
    } catch (error) {
      console.error("Failed to force recrawl", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = async (page: MongoPageData) => {
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
    } finally {
      setDetailsLoading(false)
    }
  }

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
    const absDays = Math.abs(diffMs / 86400000)
    
    // Check Calendar Match in GMT+7
    const getHCMDateStr = (ts: number) => {
      const date = new Date(ts)
      return date.toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
    }
    
    const isToday = getHCMDateStr(nowMs) === getHCMDateStr(timestamp)
    const isPast = diffMs < 0
    
    if (isToday) {
      if (isPast) {
        // Vàng: Đã đăng trong ngày hôm nay (Từ 0h đến hiện tại)
        // Độ đậm tăng rất nhẹ vì chỉ cách nhau vài tiếng
        const lightness = Math.max(30, 48 - (absDays * 10)) 
        return `hsl(45, 100%, ${lightness}%)`
      } else {
        // Xanh: Sắp đăng trong ngày hôm nay (Từ hiện tại tới 23:59:59)
        const lightness = Math.max(30, 45 - (absDays * 15)) 
        return `hsl(120, 90%, ${lightness}%)`
      }
    } else {
      if (isPast) {
        // Tím: Đã cạn lịch từ hôm qua trở về quá khứ sâu
        // Càng xa càng đậm (giảm Lightness theo ngày)
        const lightness = Math.max(25, 48 - (absDays * 2))
        return `hsl(275, 95%, ${lightness}%)`
      } else {
        // Đỏ: Lịch tương lai quá dài (Ngày mai trở đi)
        const lightness = Math.max(25, 45 - (absDays * 2))
        return `hsl(0, 95%, ${lightness}%)`
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pages Management</h1>
          <p className="text-muted-foreground mt-2">
            Monitor satellite pages and automated traffic-pulling schedules.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search page or content..."
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
            <select
              className="flex h-9 w-full sm:w-[160px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-bold cursor-pointer"
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

      <div className="flex justify-end items-center gap-2 mb-4 mt-2">
        {fetchedAt && (
          <span className="text-xs text-muted-foreground italic">
            Data synced: {new Date(fetchedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })}
          </span>
        )}
        <button 
          onClick={handleRefresh} 
          disabled={loading}
          className="p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground transition-colors disabled:opacity-50"
          title="Force Recrawl"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="flex flex-col h-[200px]">
              <CardHeader className="pb-2 flex flex-row items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-[120px]" />
              </CardHeader>
              <CardContent className="flex-1"><Skeleton className="h-3 w-full mb-2" /><Skeleton className="h-3 w-4/5" /></CardContent>
              <CardFooter className="flex justify-between border-t pt-4">
                <Skeleton className="h-5 w-[60px] rounded-full" /><Skeleton className="h-4 w-[80px]" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : data.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 bg-muted/20 border-dashed">
          <LayoutGrid className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
          <h3 className="text-xl font-semibold">No pages found</h3>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {data.map((page) => {
            const healthColor = getHealthColor(page.lastScheduledAt)
            return (
              <Card 
                key={page._id.$oid}
                className={`relative overflow-hidden border cursor-pointer flex flex-col transition-all bg-card min-h-[180px] group ${selectedPage?._id.$oid === page._id.$oid ? 'ring-2 ring-primary ring-offset-1 shadow-md' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}
                onClick={() => handleCardClick(page)}
                style={{ 
                  borderTop: `4px solid ${healthColor}`,
                  borderColor: healthColor.replace('hsl', 'hsla').replace(')', ', 0.3)')
                }}
              >
                <CardHeader className="pb-1 pt-4 px-5 flex flex-row items-start justify-between space-y-0">
                  <div className="flex w-[85%] min-h-[44px]">
                    <span className="font-semibold text-[15px] leading-snug break-words line-clamp-2">
                      {page.name}
                    </span>
                  </div>
                  <div className="size-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
                </CardHeader>
                
                <CardContent className="flex-1 px-5 pt-3 pb-3 flex flex-col justify-end">
                  <div className="text-xs flex items-center justify-between w-full">
                    <span 
                      className="font-medium"
                      style={{ color: healthColor }}
                    >
                      Scheduled: {page.queueCount || 0}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Admin: <span className="font-medium text-foreground">{page.systemUserName || "System"}</span>
                    </span>
                  </div>
                  <div className="text-[12.5px] font-medium leading-snug tracking-tight mt-3 text-left" style={{ color: healthColor }}>
                    {formatExactRelative(page.lastScheduledAt)}
                  </div>
                </CardContent>
                
                <CardFooter className="px-5 py-2.5 bg-muted/30 border-t flex flex-col gap-1.5 text-[11px] text-muted-foreground">
                  <div className="flex w-full justify-between items-center pt-0.5">
                    {page.topic ? (
                      <span className="font-bold text-primary tracking-tight">{page.topic}</span>
                    ) : (
                      <span className="font-medium text-foreground opacity-0">—</span>
                    )}
                    <span className="flex items-center gap-1">Last scheduled: <span className="font-semibold text-foreground">{
                       !page.lastScheduledAt || page.lastScheduledAt < 0 
                         ? "Chưa có lịch" 
                         : new Intl.DateTimeFormat("en-GB", {
                             timeZone: "Asia/Ho_Chi_Minh",
                             hour: "2-digit",
                             minute: "2-digit",
                             day: "2-digit",
                             month: "2-digit",
                             year: "numeric"
                           }).format(new Date(page.lastScheduledAt)).replace(',', '')
                     }</span></span>
                  </div>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      {selectedPage && (() => {
        const sheetColor = getHealthColor(selectedPage.lastScheduledAt)
        return (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div 
              className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in" 
              onClick={() => setSelectedPage(null)}
            />
            
            <div className="relative w-full sm:w-[500px] md:w-[700px] lg:w-[800px] h-full bg-background border-l shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
              <div className="p-6 border-b flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedPage.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1.5">
                    {selectedPage.topic && (
                      <span 
                        className="px-2 py-0.5 rounded-md font-medium border"
                        style={{ color: sheetColor, borderColor: `${sheetColor}40`, backgroundColor: `${sheetColor}10` }}
                      >
                        {selectedPage.topic}
                      </span>
                    )}
                    <span>•</span>
                    <span>ID: {selectedPage.pageId}</span>
                    <span className="flex-1"></span>
                    {details?.cachedAt && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                          <Clock className="w-3 h-3 not-italic" />
                          Cached Sync: {new Date(details.cachedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "medium" })}
                          <button 
                            onClick={async () => {
                              const toastId = toast.loading("Recrawling DB...")
                              try {
                                const res = await fetch(`/api/pages/${selectedPage._id.$oid}?force=true`)
                                const data = await res.json()
                                setDetails(data)
                                toast.success("Recrawl complete", { id: toastId })
                              } catch {
                                toast.error("Recrawl failed", { id: toastId })
                              }
                            }}
                            className="hover:text-foreground text-muted-foreground transition-colors cursor-pointer p-0.5 rounded-sm not-italic"
                            title="Force Recrawl"
                          >
                            <RefreshCcw className="w-3 h-3" />
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPage(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 p-6 bg-muted/30 border-b text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1">System User</span>
                  <span className="font-medium">{selectedPage.systemUserName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Source App</span>
                  <span className="font-medium">
                    {selectedPage.appName ? selectedPage.appName.charAt(0).toUpperCase() + selectedPage.appName.slice(1).toLowerCase() : "N/A"}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground block mb-1">Access Token</span>
                  <div className="flex items-center gap-2 bg-muted p-2 rounded-md font-mono text-xs overflow-hidden border">
                    <span className="truncate flex-1">
                      {showToken ? selectedPage.token : "••••••••••••••••••••••••••••••••••••••••••••••••"}
                    </span>
                    <button 
                      onClick={async () => {
                        await navigator.clipboard.writeText("")
                        await navigator.clipboard.writeText(selectedPage.token)
                        toast.success("Copied Access Token to clipboard")
                      }} 
                      className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer" 
                      title="Copy Token"
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button onClick={() => setShowToken(!showToken)} className="text-primary font-medium hover:underline whitespace-nowrap px-1 cursor-pointer">
                      {showToken ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {detailsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full rounded-xl" />
                    <Skeleton className="h-40 w-full rounded-xl" />
                  </div>
                ) : details ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-muted-foreground" /> Scheduled Post Stats
                    </h3>
                    <div className="grid grid-cols-3 gap-3 mb-8">
                      <Card className="bg-card shadow-sm border-l-[3px]" style={{ borderLeftColor: "hsl(142, 71%, 40%)" }}>
                        <CardContent className="p-3 text-center">
                          <div className="text-2xl font-bold" style={{ color: "hsl(142, 71%, 40%)" }}>{details.stats?.today || 0}</div>
                          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Today</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-card shadow-sm border-l-[3px]" style={{ borderLeftColor: "hsl(0, 85%, 60%)" }}>
                        <CardContent className="p-3 text-center">
                          <div className="text-2xl font-bold" style={{ color: "hsl(0, 85%, 60%)" }}>{details.stats?.tomorrow || 0}</div>
                          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Tomorrow</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-card shadow-sm border-l-[3px]" style={{ borderLeftColor: "hsl(0, 85%, 38%)" }}>
                        <CardContent className="p-3 text-center">
                          <div className="text-2xl font-bold" style={{ color: "hsl(0, 85%, 38%)" }}>{details.stats?.later || 0}</div>
                          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Later On</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex border-b mb-4 gap-4">
                      <button 
                        onClick={() => setActiveTab("queue")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "queue" ? "text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                        style={{ borderBottomColor: activeTab === "queue" ? sheetColor : 'transparent' }}
                      >
                        <div className="flex items-center gap-2">
                          <CalendarClock className="w-4 h-4"/> Upcoming Queue
                        </div>
                      </button>
                      <button 
                        onClick={() => setActiveTab("history")}
                        className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === "history" ? "text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                        style={{ borderBottomColor: activeTab === "history" ? sheetColor : 'transparent' }}
                      >
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4"/> Post History
                        </div>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activeTab === "queue" && details.queue.map(q => {
                        const itemColor = getHealthColor(q.scheduledAt)
                        return (
                          <div key={q.id} className="p-3.5 rounded-lg border bg-card text-sm shadow-sm transition-hover hover:border-primary/50" style={{ borderLeft: `3px solid ${itemColor}` }}>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <p className="text-foreground flex-1 break-all mt-1">{q.content}</p>
                              <button 
                                onClick={async () => {
                                  await navigator.clipboard.writeText("")
                                  const textToCopy = q.content.replace("ItemID: ", "")
                                  await navigator.clipboard.writeText(textToCopy)
                                  toast.success("Copied ItemID to clipboard")
                                }}
                                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer shrink-0"
                                title="Copy ItemID"
                              >
                                <Copy className="size-3.5" />
                              </button>
                            </div>
                            <p className="text-xs flex items-center gap-1.5 text-foreground">
                              <Clock className="w-3.5 h-3.5" style={{ color: itemColor }}/> Scheduled: <span className="font-bold">{new Date(q.scheduledAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "medium" })}</span>
                            </p>
                          </div>
                        )
                      })}
                      {activeTab === "history" && details.history.map(h => (
                        <div key={h.id} className="p-3.5 rounded-lg border bg-card text-sm flex gap-3 items-start shadow-sm transition-hover hover:border-primary/50 opacity-80">
                          <div className={`mt-1.5 size-2.5 rounded-full shrink-0 ${h.status === "Success" ? "bg-emerald-500" : "bg-rose-500"}`} />
                          <div className="flex-1">
                             <div className="flex items-start justify-between gap-3 mb-2">
                               <p className="text-foreground flex-1 break-all mt-1">{h.content}</p>
                               <button 
                                 onClick={async () => {
                                   await navigator.clipboard.writeText("")
                                   const textToCopy = h.content.replace("ItemID: ", "")
                                   await navigator.clipboard.writeText(textToCopy)
                                   toast.success("Copied ItemID to clipboard")
                                 }}
                                 className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer shrink-0"
                                 title="Copy ItemID"
                               >
                                 <Copy className="size-3.5" />
                               </button>
                             </div>
                             <p className="text-xs text-foreground flex items-center gap-1.5">
                               <Clock className="w-3.5 h-3.5 text-muted-foreground"/> Posted: <span className="font-bold">{new Date(h.postedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "medium" })}</span>
                             </p>
                          </div>
                        </div>
                      ))}
                      {activeTab === "queue" && details.queue.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                           <CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                           <p className="text-sm">No upcoming posts found in queue.</p>
                        </div>
                      )}
                      {activeTab === "history" && details.history.length === 0 && (
                        <div className="py-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                           <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                           <p className="text-sm">No posting history records found.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  Newspaper, 
  Share2, 
  RefreshCcw, 
  Calendar,
  AlertCircle, 
  Copy, 
  Loader2,
  PieChart,
  Layers,
  Clock,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface QueueItem {
  _id: string
  itemId: string
  createdAt: string
  type?: string
  failCount?: number
  page?: string
  scheduleAt?: number
}

interface QueuesData {
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

// Simple Custom Progress Component
const CustomProgress = ({ value }: { value: number }) => (
  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border-none mt-1 shadow-inner">
    <div 
      className="h-full bg-gradient-to-r from-emerald-300 to-emerald-400 transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(110,231,183,0.25)]"
      style={{ width: `${value}%` }}
    />
  </div>
);

export default function SchedulesPage() {
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<QueuesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [nextSyncProgress, setNextSyncProgress] = useState(100)
  const [lastSyncTime, setLastSyncTime] = useState<number>(Date.now())

  useEffect(() => {
    setMounted(true)
  }, [])

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
    } catch (error: any) {
      console.error("Failed to fetch queues", error)
      toast.error("Database Connection Refused", {
        description: "Protocol ECONNREFUSED when reaching Atlas Cluster.",
      })
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return;
    fetchData()
    const pollInterval = 60000;
    const updateFreq = 1000;

    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setNextSyncProgress(prev => {
          if (prev >= 100) {
            fetchData();
            return 0;
          }
          return prev + (100 / (pollInterval / updateFreq));
        });
      }
    }, updateFreq);

    return () => clearInterval(timer);
  }, [fetchData, mounted])

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id)
    toast.success("Protocol ID Copied", { duration: 800 })
  }

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-8 h-[calc(100vh-100px)] overflow-hidden">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b pb-6 px-1 shrink-0">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Calendar className="size-5" />
            <h1 className="text-3xl font-bold tracking-tight">Content & Schedules</h1>
          </div>
          <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-2xl">
            Universal posting calendar and content asset pipelines. Real-time background nodes are monitoring and distributing your content.
          </p>
        </div>
        
        <div className="inline-flex flex-col items-end gap-3 w-auto self-end">
          {/* Row 1: Last Sync & Combined Status/Refresh Pill */}
          <div className="flex items-center gap-3 whitespace-nowrap">
             <span className="text-[10px] italic text-muted-foreground/60">
               Last sync: {new Date(lastSyncTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
             </span>
             
             <button 
                onClick={() => fetchData(true)}
                disabled={isRefreshing || loading}
                className="flex items-center gap-2.5 px-3.5 py-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-full border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all disabled:opacity-50 group shadow-sm shrink-0"
                title="Force Resync"
              >
                <div className="flex items-center gap-2 pr-2.5 border-r border-slate-300 dark:border-slate-600">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-tight">Live</span>
                </div>
                {isRefreshing || loading ? (
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                ) : (
                  <RefreshCcw className="size-3.5 text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                )}
             </button>
          </div>
          
          {/* Row 2: Next Sync Progress Bar (Matches Width of Row 1) */}
          <div className="flex flex-col w-full">
            <div className="flex justify-between items-center mb-1.5 px-1">
               <span className="text-[10px] text-muted-foreground/50 font-medium">Next Sync</span>
               <span className="text-[10px] font-bold tabular-nums text-primary/70">{Math.max(0, Math.floor(60 * (1 - nextSyncProgress / 100)))}s</span>
            </div>
            <CustomProgress value={nextSyncProgress} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch flex-1 overflow-hidden min-h-0 pb-4">
        {/* CRAWL QUEUE */}
        <QueueSection 
          id="crawl-queue"
          title="Crawl Queue"
          items={data?.crawlQueue}
          stats={data?.stats?.crawl}
          loading={loading}
          icon={<Database className="size-4 text-indigo-500" />}
          color="indigo"
          onCopy={copyId}
          type="crawl"
        />

        {/* NEWS QUEUE */}
        <QueueSection 
          id="news_queue"
          title="News Queue"
          items={data?.newsQueue}
          stats={data?.stats?.news}
          loading={loading}
          icon={<Newspaper className="size-4 text-emerald-500" />}
          color="emerald"
          onCopy={copyId}
          type="news"
        />

        {/* SOCIAL QUEUE */}
        <QueueSection 
          id="social_queue"
          title="Social Queue"
          items={data?.socialQueue}
          stats={data?.stats?.social}
          loading={loading}
          icon={<Share2 className="size-4 text-amber-500" />}
          color="amber"
          onCopy={copyId}
          type="social"
        />
      </div>
    </div>
  )
}

function QueueSection({ title, items, stats, loading, icon, color, onCopy, type }: any) {
  return (
    <div className="flex flex-col h-full min-h-0">
      <Card className="flex flex-col h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all duration-300">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/50 shrink-0 bg-slate-50/30 dark:bg-slate-900/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm`}>
                {icon}
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</CardTitle>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase opacity-80 flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Running
                   </span>
                </div>
              </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100">{stats?.total || 0}</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Units</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             {type === 'crawl' ? (
                <>
                  <Metric label="Fails" value={stats?.fails || 0} icon={<AlertCircle className="size-3" />} highlight={stats?.fails > 0} />
                  <Metric label={Object.keys(stats?.types || {})?.[0] || 'Crawler'} value={Object.values(stats?.types || {})?.[0] || 0} icon={<Layers className="size-3" />} />
                </>
             ) : type === 'news' ? (
                <>
                  <Metric label="Vaulted" value={stats?.total || 0} icon={<PieChart className="size-3" />} />
                  <Metric label="State" value="Ready" icon={<Clock className="size-3" />} />
                </>
             ) : (
                <>
                  <Metric label="Distributing" value={stats?.total || 0} icon={<Share2 className="size-3" />} />
                  <Metric label="Pages" value={stats?.pages || 0} icon={<Database className="size-3" />} />
                </>
             )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white dark:bg-slate-950/20">
          <div className="flex flex-col gap-2.5">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 w-full rounded-2xl opacity-50" />)}
              </div>
            ) : items && items.length > 0 ? (
              items.map((item: any) => (
                <QueueItemRecord key={item._id} item={item} type={type} onCopy={() => onCopy(item.itemId)} />
              ))
            ) : (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-5">
                <div className="size-20 rounded-full bg-white/50 dark:bg-slate-900/50 flex items-center justify-center shadow-inner border border-slate-100 dark:border-slate-800">
                    <Clock className="size-10 text-slate-300 dark:text-slate-700" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Queue Clear</p>
                  <p className="text-[11px] text-slate-400/60 dark:text-slate-600/60 italic">Standby for incoming node cluster.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ label, value, icon, highlight = false }: any) {
  return (
    <div className={`flex flex-col gap-1 p-2 rounded-md border bg-background/50 shadow-sm ${highlight ? 'border-rose-200 bg-rose-50/50 text-rose-600 dark:border-rose-900 dark:bg-rose-900/10' : ''}`}>
      <span className="text-[8px] font-bold uppercase tracking-widest leading-none opacity-60 flex items-center gap-1">
        {icon} {label}
      </span>
      <span className="text-xs font-bold uppercase tracking-tight tabular-nums leading-none">
        {value}
      </span>
    </div>
  )
}

function QueueItemRecord({ item, type, onCopy }: any) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isFailed = item.failCount > 0;
  
  let color = "emerald"; 
  let intensity = 1;
  let statusLabel = "";
  const scheduleTime = type === 'social' ? item.scheduleAt : new Date(item.createdAt).getTime();

  if (type === 'social') {
    const diffMs = scheduleTime - now;
    // 5-minute grace period (300,000ms)
    const isEssentiallyOverdue = diffMs < -300000;
    
    if (isFailed || isEssentiallyOverdue) {
      color = "purple";
      intensity = 1;
      statusLabel = isFailed ? "Error" : "Overdue";
    } else if (diffMs < 5 * 60 * 60 * 1000) {
      color = "emerald";
      const ratio = 1 - Math.max(0, diffMs) / (5 * 60 * 60 * 1000);
      intensity = 0.4 + (0.6 * ratio);
      statusLabel = diffMs < 0 ? "Posting" : "Queued";
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      color = "yellow";
      intensity = 0.4 + (0.6 * (diffMs - 5 * 60 * 60 * 1000) / (19 * 60 * 60 * 1000));
      statusLabel = "Queued";
    } else {
      color = "rose";
      intensity = 0.4 + (0.6 * Math.min(1, (diffMs - 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000)));
      statusLabel = "Queued";
    }
  } else {
    // Crawl and News items
    color = isFailed ? "purple" : "emerald";
    intensity = 1;
    statusLabel = isFailed ? "Error" : (item.status || "Pending");
  }

  const statusColorMap: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    rose: "text-rose-600 dark:text-rose-400",
    purple: "text-purple-600 dark:text-purple-400",
  };

  const formattedCreated = new Date(item.createdAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  });
  
  const formattedUpdated = item.updatedAt ? new Date(item.updatedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }) : null;

  const formattedDisplayTime = type === 'social' ? new Date(scheduleTime).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true
  }) : formattedCreated;

  const getCountdown = (ms: number) => {
    if (ms < 0) {
      if (ms > -300000) return "Posting now...";
      return "Overdue";
    }
    const absMs = Math.abs(ms);
    const days = Math.floor(absMs / (24 * 3600 * 1000));
    const hours = Math.floor((absMs % (24 * 3600 * 1000)) / (3600 * 1000));
    const mins = Math.floor((absMs % (3600 * 1000)) / (60 * 1000));
    const secs = Math.floor((absMs % (60 * 1000)) / 1000);
    
    const sign = "-";
    if (days > 0) return `${sign}${days}d ${hours}h`;
    if (hours > 0) return `${sign}${hours}h ${mins}m`;
    return `${sign}${mins}m ${secs}s`;
  };

  return (
    <div 
      className={`relative flex flex-col gap-2.5 p-3.5 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.05)] border-l-[3px] group hover:shadow-md transition-all duration-300`}
      style={{ borderLeftColor: `rgba(${color === 'emerald' ? '16,185,129' : color === 'yellow' ? '250,204,21' : color === 'rose' ? '244,63,94' : '168,85,247'}, ${intensity})` }}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-1.5 min-w-0">
          <div className="flex items-center gap-2 group/id">
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate" title={item.itemId}>
              {item.itemId.slice(0, 15)}...
            </span>
            <button 
              onClick={onCopy} 
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-300 hover:text-slate-500 transition-colors opacity-0 group-hover:opacity-100 group-hover/id:opacity-100"
            >
              <Copy className="size-3" />
            </button>
          </div>
          
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200">
                {formattedDisplayTime}
              </span>
              {type === 'social' && (
                <>
                  <div className="size-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <span className={`text-[10px] font-bold ${statusColorMap[color]}`}>
                    {statusLabel}
                  </span>
                </>
              )}
            </div>

            {type !== 'social' && (
              <>
                {formattedUpdated && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                    Updated: {formattedUpdated}
                  </span>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-bold ${statusColorMap[color]}`}>
                    {statusLabel}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {type === 'social' && (
           <div className="text-right shrink-0">
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 leading-none mb-1.5 opacity-60">Time</p>
              <p className="text-[13px] font-bold tracking-tight text-slate-800 dark:text-slate-100">{getCountdown(scheduleTime - now)}</p>
           </div>
        )}
      </div>

      {(type === 'social' && item.page) && (
        <div className="flex items-center justify-between pt-1.5 mt-0.5 border-t border-slate-100/50 dark:border-slate-800/30">
           <div className="flex items-center gap-1.5 opacity-30 group-hover:opacity-50 transition-opacity">
              <Share2 className="size-2.5" />
              <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{item.page}</span>
           </div>
           
           {isFailed && (
             <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-none text-[8px] px-1.5 py-0 font-black uppercase tracking-widest h-3.5">
               Fail
             </Badge>
           )}
        </div>
      )}
    </div>
  )
}

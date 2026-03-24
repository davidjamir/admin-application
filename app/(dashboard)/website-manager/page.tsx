"use client"

import { useEffect, useState, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Globe, Search, RefreshCcw, Copy, X,
  CheckCircle2, PauseCircle, Clock, ExternalLink,
  BookOpen, Link2, BarChart3, ChevronUp, ChevronDown, ChevronsUpDown
} from "lucide-react"
import { toast } from "sonner"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, ReferenceLine
} from "recharts"

/* ─────────────── Types ─────────────── */
interface Blog {
  _id: string; blogDns: string; blogEmail: string; blogIndex: number
  blogPassword: string; blogPriority: number; blogUser: string
  channel: string; enabled: boolean; wrapDomain: string
  createdAt: number; updatedAt: number
}
interface Wrap {
  _id: string; prefix: string; wrap_host: string
  target_host: string; createdAt: number; updatedAt: number
}
interface Quota {
  _id: string; count: number; date: string; domain: string
  key: string; limit: number; type: string
  createdAt: number; updatedAt: number
}
/** One row per domain in the table — holds latest record + all history */
interface QuotaGroup {
  domain: string
  type: string
  latest: Quota
  history: Quota[]   // all records for this domain, sorted by date asc
}
type TabKey = "blogs" | "wraps" | "quotas"
type SelectedItem = { tab: TabKey; data: Blog | Wrap | QuotaGroup }

/* ─────────────── Helpers ─────────────── */
const fmtDate = (ms: number) =>
  new Date(ms).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })
const fmtShort = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium" })

/** Extract origin (last 2 parts) from a subdomain */
const getOrigin = (domain: string) => domain.split(".").slice(-2).join(".")

/** Check if a domain belongs to an origin */
const isFromOrigin = (domain: string, origin: string) => {
  if (origin === "all") return true
  return domain === origin || domain.endsWith("." + origin)
}

/* ─────────────── Sort Hook ─────────────── */
function useSort<T>(data: T[], defaultKey: string) {
  const [key, setKey] = useState<string>(defaultKey)
  const [dir, setDir] = useState<"asc" | "desc">("asc")
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getVal = (obj: any, path: string): any => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return path.split('.').reduce((acc, part) => acc && typeof acc === 'object' ? (acc as any)[part] : undefined, obj)
  }

  const toggle = (k: string) => {
    if (key === k) setDir(d => d === "asc" ? "desc" : "asc")
    else { setKey(k); setDir("asc") }
  }
  const sorted = useMemo(() => [...data].sort((a, b) => {
    const av = getVal(a, key), bv = getVal(b, key)
    if (av < bv) return dir === "asc" ? -1 : 1
    if (av > bv) return dir === "asc" ? 1 : -1
    return 0
  }), [data, key, dir])
  const Icon = ({ col }: { col: string }) => {
    if (key !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
    return dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }
  return { sorted, toggle, Icon, key }
}

/* ══════════════ Page ══════════════ */
export default function WebsiteManagerPage() {
  const [blogs, setBlogs]   = useState<Blog[]>([])
  const [wraps, setWraps]   = useState<Wrap[]>([])
  const [quotas, setQuotas] = useState<Quota[]>([])
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [tab, setTab]             = useState<TabKey>("blogs")
  const [search, setSearch]       = useState("")
  const [originFilter, setOriginFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [hasInitializedDate, setHasInitializedDate] = useState(false)
  const [selected, setSelected]   = useState<SelectedItem | null>(null)
  const [mounted, setMounted] = useState(false)

  const fetchData = async (force = false) => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/websites${force ? "?force=true" : ""}`)
      if (!res.ok) throw new Error(await res.text())
      const d = await res.json()
      setBlogs(d.blogs || [])
      setWraps(d.wraps || [])
      setQuotas(d.quotas || [])
      if (d.fetchedAt) setFetchedAt(d.fetchedAt)
    } catch { toast.error("Failed to load Website Manager data") }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { 
    setMounted(true)
    fetchData() 
  }, [])

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText("")
    await navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}`)
  }

  /* ── filtered per tab ── */
  const q = search.toLowerCase()
  const filteredBlogs  = useMemo(() => blogs.filter(b => {
    const matchSearch = !q || b.blogDns.toLowerCase().includes(q) || b.blogUser.toLowerCase().includes(q) || b.channel.toLowerCase().includes(q)
    const matchOrigin = originFilter === "all" || getOrigin(b.blogDns) === originFilter
    return matchSearch && matchOrigin
  }), [blogs, q, originFilter])

  const filteredWraps  = useMemo(() => wraps.filter(w => {
    const matchSearch = !q || w.wrap_host.toLowerCase().includes(q) || w.target_host.toLowerCase().includes(q) || w.prefix.toLowerCase().includes(q)
    const matchOrigin = originFilter === "all" || getOrigin(w.target_host) === originFilter
    return matchSearch && matchOrigin
  }), [wraps, q, originFilter])



  /* ── sort hooks ── */
  const blogSort  = useSort(filteredBlogs,  "blogDns")
  const wrapSort  = useSort(filteredWraps,  "wrap_host")
  /* ── Group subdomain quotas by domain (FULL history always) ── */
  /* ── 1. Base Data Filters ── */
  const originQuotas = useMemo(() => quotas.filter(q => q.type === "origin"), [quotas])
  
  const allSubdomainGroups = useMemo<QuotaGroup[]>(() => {
    const subQuotas = quotas.filter(q => q.type === "subdomain")
    const map = new Map<string, Quota[]>()
    subQuotas.forEach(qt => {
      const arr = map.get(qt.domain) || []
      arr.push(qt)
      map.set(qt.domain, arr)
    })
    const groups: QuotaGroup[] = []
    map.forEach((recs, domain) => {
      const sorted = [...recs].sort((a, b) => b.date.localeCompare(a.date)) // newest first
      groups.push({
        domain,
        type: sorted[0].type,
        latest: sorted[0], // Absolute latest by default
        history: [...recs].sort((a, b) => a.date.localeCompare(b.date)), // oldest→newest for chart
      })
    })
    return groups
  }, [quotas])

  const allOriginNames = useMemo(() => {
    const fromOrigins = originQuotas.map(q => q.domain)
    const fromSubdomains = allSubdomainGroups.map(g => getOrigin(g.domain))
    return Array.from(new Set([...fromOrigins, ...fromSubdomains])).sort()
  }, [originQuotas, allSubdomainGroups])

  const allDates = useMemo(() => {
    const dates = Array.from(new Set(quotas.filter(q => q.type === 'subdomain').map(q => q.date))).sort().reverse()
    return dates
  }, [quotas])

  const dateList = useMemo(() => ["all", ...allDates], [allDates])

  const todayStr = useMemo(() => 
    new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).replace(/-/g, ""),
  [])

  /* ── 2. Aggregations ── */

  const originHistory = useMemo(() => {
    // Get last 10 days
    const dates = [...allDates].reverse().slice(-10)
    
    // Group by date
    return dates.map(date => {
      const dayData: Record<string, number | string> = { date: date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") }
      
      // Initialize all origins to 0 to prevent gaps
      allOriginNames.forEach(name => {
        dayData[`origin_${name}`] = 0
      })

      const recs = originQuotas.filter(q => q.date === date)
      
      let dayTotal = 0
      recs.forEach(r => {
        const key = `origin_${r.domain}`
        dayData[key] = (Number(dayData[key]) || 0) + r.count
        dayTotal += r.count
      })
      dayData.total = dayTotal
      return dayData
    })
  }, [originQuotas, allDates, allOriginNames])

  /* ── 3. Post-Aggregation Filtering ── */
  const filteredGroups = useMemo(() => {
    const q2 = search.toLowerCase()
    return allSubdomainGroups
      .map(g => {
        // If date filter is active, find the record for that date
        if (dateFilter !== "all") {
          const matched = g.history.find(r => r.date === dateFilter)
          if (!matched) return null // Drop groups that don't have data for this date
          return { ...g, latest: matched } // Override latest for display
        }
        return g
      })
      .filter((g): g is QuotaGroup => {
        if (!g) return false
        const matchSearch = g.domain.toLowerCase().includes(q2) || g.type.toLowerCase().includes(q2)
        const matchOrigin = isFromOrigin(g.domain, originFilter)
        return matchSearch && matchOrigin
      })
  }, [allSubdomainGroups, search, originFilter, dateFilter])

  /** Latest stats for each origin (for sorting/filtering list) */


  const originList = useMemo(() => ["all", ...allOriginNames], [allOriginNames])

  // Set initial date filter to latest date when data first loads
  useEffect(() => {
    if (allDates.length > 0 && !hasInitializedDate) {
      setDateFilter(allDates[0])
      setHasInitializedDate(true)
    }
  }, [allDates, hasInitializedDate])

  const quotaSort = useSort(filteredGroups, "domain")

  const tabMeta: Record<TabKey, { label: string; count: number; icon: typeof Globe }> = {
    blogs:  { label: "Blogs",  count: blogs.length,           icon: BookOpen  },
    wraps:  { label: "Wraps",  count: wraps.length,           icon: Link2     },
    quotas: { label: "Quotas", count: allSubdomainGroups.length, icon: BarChart3 },
  }


  /* ── Detail panel renderer ── */
  const renderDetail = () => {
    if (!selected) return null
    const { tab: t, data } = selected

    if (t === "blogs") {
      const b = data as Blog
      return (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "DNS",      v: b.blogDns     },
              { l: "Channel",  v: b.channel     },
              { l: "Index",    v: String(b.blogIndex) },
              { l: "Priority", v: String(b.blogPriority) },
            ].map(({ l, v }) => (
              <div key={l} className="p-3 rounded-lg bg-muted/50 border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l}</div>
                <div className="font-medium text-sm truncate">{v || "—"}</div>
              </div>
            ))}
          </div>
          {/* Credentials block */}
          <div className="rounded-lg border border-border/40 bg-muted/50 divide-y divide-border/40">
            {[
              { l: "Gmail User", v: b.blogUser },
              { l: "Blog Email", v: b.blogEmail },
              { l: "Password",   v: b.blogPassword },
              { l: "Wrap Domain", v: b.wrapDomain },
            ].map(({ l, v }) => (
              <div key={l} className="flex items-center justify-between px-3 py-2.5 gap-3">
                <span className="text-xs text-muted-foreground shrink-0 w-28">{l}</span>
                <span className="text-xs font-mono truncate flex-1">{v || "—"}</span>
                {v && (
                  <button onClick={() => copy(v, l)} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0">
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/40">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
            {b.enabled
              ? <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold"><CheckCircle2 className="w-4 h-4" /> Enabled</span>
              : <span className="flex items-center gap-1.5 text-sm text-rose-500 font-semibold"><PauseCircle className="w-4 h-4" /> Disabled</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/40"><div className="text-[10px] uppercase mb-1">Created</div><div className="italic">{fmtDate(b.createdAt)}</div></div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/40"><div className="text-[10px] uppercase mb-1">Updated</div><div className="italic">{fmtDate(b.updatedAt)}</div></div>
          </div>
        </div>
      )
    }

    if (t === "wraps") {
      const w = data as Wrap
      return (
        <div className="p-5 space-y-4">
          <div className="rounded-lg border bg-muted/50 divide-y">
            {[
              { l: "Wrap Host",   v: w.wrap_host   },
              { l: "Prefix",      v: w.prefix      },
              { l: "Target Host", v: w.target_host },
            ].map(({ l, v }) => (
              <div key={l} className="flex items-center justify-between px-3 py-3 gap-3">
                <span className="text-xs text-muted-foreground shrink-0 w-28">{l}</span>
                <span className="text-sm font-mono truncate flex-1">{v || "—"}</span>
                {v && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => copy(v, l)} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                      <Copy className="w-3 h-3" />
                    </button>
                    {(l === "Wrap Host" || l === "Target Host") && (
                      <a href={`https://${v}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Full Wrap URL</div>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono flex-1 text-primary">{w.wrap_host}/{w.prefix}</code>
              <button onClick={() => copy(`${w.wrap_host}/${w.prefix}`, "Wrap URL")} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                <Copy className="w-3 h-3" />
              </button>
              <a href={`https://${w.wrap_host}/${w.prefix}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/40"><div className="text-[10px] uppercase mb-1">Created</div><div className="italic">{fmtDate(w.createdAt)}</div></div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/40"><div className="text-[10px] uppercase mb-1">Updated</div><div className="italic">{fmtDate(w.updatedAt)}</div></div>
          </div>
        </div>
      )
    }

    if (t === "quotas") {
      const g = data as QuotaGroup
      const qt = g.latest
      const pct = qt.limit > 0 ? Math.round((qt.count / qt.limit) * 100) : 0
      const barColor = pct >= 90 ? "hsl(0,85%,45%)" : pct >= 70 ? "hsl(38,92%,50%)" : "hsl(142,71%,40%)"
      const last10 = [...allDates].reverse().slice(-10)
      const chartData = last10.map(d => {
        const r = g.history.find(h => h.date === d)
        return {
          date: d,
          count: r ? r.count : 0,
          limit: r ? r.limit : (g.latest?.limit || 0),
          pct: r ? (r.limit > 0 ? Math.round((r.count / r.limit) * 100) : 0) : 0,
        }
      })
      return (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-lg bg-muted/50 border text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Day Count</div>
              <div className="font-bold text-lg" style={{ color: barColor }}>{qt.count}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Limit</div>
              <div className="font-bold text-lg">{qt.limit}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Usage %</div>
              <div className="font-bold text-lg" style={{ color: barColor }}>{pct}%</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Day Snapshot — {qt.date}</span>
              <span className="text-xs font-semibold" style={{ color: barColor }}>{qt.count} / {qt.limit}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 divide-y">
            {[
              { l: "Domain", v: g.domain },
              { l: "Type",   v: g.type   },
              { l: "Key",    v: qt.key   },
            ].map(({ l, v }) => (
              <div key={l} className="flex items-center justify-between px-3 py-2.5 gap-3">
                <span className="text-xs text-muted-foreground shrink-0 w-16">{l}</span>
                <span className="text-xs font-mono truncate flex-1">{v || "—"}</span>
                {v && (
                  <button onClick={() => copy(v, l)} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0">
                    <Copy className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
              Usage History — {g.history.length} day{g.history.length !== 1 ? "s" : ""}
            </div>
            {chartData.length <= 1 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Not enough history to chart</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                     <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(217,91%,60%)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="hsl(217,91%,60%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,88%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(4)} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <RTooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid hsl(0,0%,88%)" }}
                    formatter={(val: number | string, name: string) => [val, name === "count" ? "Posts" : "Limit"]}
                    labelFormatter={l => `Date: ${String(l).replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}`}
                  />
                  {qt.limit > 0 && (
                    <ReferenceLine y={qt.limit} stroke="hsl(0,85%,55%)" strokeDasharray="4 2"
                      label={{ value: `Limit ${qt.limit}`, position: "right", fontSize: 9, fill: "hsl(0,85%,55%)" }} />
                  )}
                  <Area type="monotone" dataKey="count" stroke="hsl(217,91%,55%)" fill="url(#usageGrad)"
                    strokeWidth={2} dot={{ r: 3, fill: "hsl(217,91%,55%)" }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Last Updated</div>
            <div className="text-xs italic">{fmtDate(qt.updatedAt)}</div>
          </div>
        </div>
      )
    }
  }

  /* ═══════════════ Render ═══════════════ */
  if (!mounted) {
    return (
      <div className="flex flex-col gap-5 p-6 h-full items-center justify-center min-h-[400px]">
        <RefreshCcw className="w-8 h-8 text-primary animate-spin opacity-20" />
        <p className="text-xs text-muted-foreground animate-pulse">Initializing dashboard...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-6 h-full" suppressHydrationWarning>
      {/* Backdrop */}
      {selected && (
        <div
          className="fixed inset-0 z-30 bg-background/50 backdrop-blur-[2px] animate-in fade-in"
          onClick={() => setSelected(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Websites Manager</h1>
          </div>
          {fetchedAt && (
            <p className="text-xs text-muted-foreground ml-[52px] italic flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Cached Sync: {fmtDate(fetchedAt)}
              <button onClick={async () => { const id = toast.loading("Recrawling..."); await fetchData(true); toast.success("Refreshed", { id }) }} className="cursor-pointer hover:text-foreground transition-colors text-muted-foreground">
                <RefreshCcw className="w-3 h-3" />
              </button>
            </p>
          )}
        </div>
        <button onClick={async () => { const id = toast.loading("Refreshing..."); await fetchData(true); toast.success("Done", { id }) }}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-muted transition-colors text-sm font-medium cursor-pointer disabled:opacity-50">
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {(["blogs","wraps","quotas"] as TabKey[]).map(k => {
          const m = tabMeta[k]
          const Icon = m.icon
          const colors = { blogs: "hsl(217,91%,50%)", wraps: "hsl(142,71%,40%)", quotas: "hsl(38,92%,50%)" }
          return (
            <button key={k} onClick={() => { setTab(k); setSearch("") }}
              className={`flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card shadow-sm cursor-pointer hover:bg-muted/40 transition-colors text-left ${tab === k ? "ring-2 ring-primary/40" : ""}`}>
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${colors[k]}15` }}>
                <Icon className="w-4 h-4" style={{ color: colors[k] }} />
              </div>
              <div>
                <div className="text-xl font-bold tabular-nums" style={{ color: colors[k] }}>
                  {loading ? "—" : m.count}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">{m.label}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Origin Statistics Chart */}
      {!loading && originHistory.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" />
                Origin Statistics (Last 10 Days)
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Daily post aggregated trend for all origins</div>
            </div>
          </div>

          <div className="h-[220px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={originHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                  </linearGradient>
                  {allOriginNames.map((name, i) => (
                    <linearGradient key={name} id={`color-${name}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={`hsl(${(i * 137) % 360}, 70%, 50%)`} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={`hsl(${(i * 137) % 360}, 70%, 50%)`} stopOpacity={0}/>
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                  tickFormatter={d => d.split("-").slice(1).join("/")}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                  axisLine={false}
                  tickLine={false}
                />
                <RTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const date = label;
                      const items = payload
                        .filter(p => p.dataKey !== 'total' && typeof p.value === 'number')
                        .map(p => ({
                          name: String(p.name),
                          value: Number(p.value),
                          color: String(p.color)
                        }))
                        .sort((a, b) => b.value - a.value);
                      const total = payload.find(p => p.dataKey === 'total')?.value;
                      return (
                        <div className="bg-background border border-border/40 rounded-lg shadow-xl p-3 min-w-[180px] z-50">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2 border-b border-border/40 pb-1">{date}</div>
                          <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                            {items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between gap-4 text-[11px]">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="font-medium truncate">{item.name}</span>
                                <span className="font-bold tabular-nums">{item.value}</span>
                              </div>
                            ))}
                          </div>
                          {items.length === 0 && <div className="text-[10px] text-muted-foreground py-2 text-center italic">No data</div>}
                          <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-bold">
                            <span>{originFilter === "all" ? "Total Posts" : "Posts Count"}</span>
                            <span className={originFilter === "all" ? "text-primary" : ""}>
                              {originFilter === "all" ? (total || 0) : (payload[0]?.payload?.[`origin_${originFilter}`] || 0)}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                  name="Total"
                  hide={originFilter !== "all"}
                  dot={{ r: 3, fill: "hsl(217, 91%, 60%)", strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
                {allOriginNames.map((name, i) => (
                  <Area
                    key={name}
                    type="monotone"
                    dataKey={`origin_${name}`}
                    stroke={`hsl(${(i * 137) % 360}, 60%, 45%)`}
                    strokeWidth={1}
                    fillOpacity={1}
                    fill={`url(#color-${name})`}
                    name={name}
                    hide={originFilter !== "all" && originFilter !== name}
                    connectNulls
                    dot={originFilter !== "all" ? { r: 2, fill: `hsl(${(i * 137) % 360}, 60%, 45%)`, strokeWidth: 0 } : false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {originFilter !== "all" && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
              <span className="text-xs text-muted-foreground italic">Filtering origins by parent domain</span>
              <button onClick={() => setOriginFilter("all")} className="text-xs text-primary font-semibold hover:underline cursor-pointer">View All Origins</button>
            </div>
          )}
        </div>
      )}

      <div className="pt-2" />

      {/* Tab bar */}
      <div className="flex border-b border-border/40 gap-1 mt-6">
        {(["blogs","wraps","quotas"] as TabKey[]).map(k => (
          <button key={k} onClick={() => { setTab(k); setSearch("") }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tabMeta[k].label}
            <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
              {loading ? "…" :
                k === "blogs" ? filteredBlogs.length :
                k === "wraps" ? filteredWraps.length :
                filteredGroups.length}
            </span>
          </button>
        ))}
      </div>

      {/* ── Blogs Table ── */}
      {tab === "blogs" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder={`Search ${tabMeta[tab].label.toLowerCase()}...`}
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Origin:</span>
              <select value={originFilter} onChange={e => setOriginFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-border/40 bg-card text-xs font-semibold focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 min-w-[140px] shadow-sm">
                {originList.map(o => (
                  <option key={o} value={o}>{o === "all" ? "All Origins" : o}</option>
                ))}
              </select>
            </div>
          </div>

          {!loading && blogSort.sorted.length > 0 && (
            <div className="text-xs text-muted-foreground px-1 italic">Found {blogSort.sorted.length} of {blogs.length} blogs</div>
          )}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/40">
                <TH label="DNS"      col="blogDns"      sort={blogSort} />
                <TH label="Channel"  col="channel"      sort={blogSort} />
                <TH label="User"     col="blogUser"     sort={blogSort} />
                <TH label="Priority" col="blogPriority" sort={blogSort} />
                <TH label="Status"   col="enabled"      sort={blogSort} />
                <TH label="Updated"  col="updatedAt"    sort={blogSort} />
              </tr></thead>
              <tbody>
                {loading ? Array.from({length:5}).map((_,i) => (
                  <tr key={i} className="border-b">{Array.from({length:6}).map((_,j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full"/></td>)}</tr>
                )) : blogSort.sorted.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-25"/><p>No blogs found</p></td></tr>
                ) : blogSort.sorted.map(b => (
                  <tr key={b._id} onClick={() => setSelected({ tab: "blogs", data: b })}
                    className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${(selected?.data as Blog)?._id === b._id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                    <td className="px-4 py-3 font-medium font-mono text-xs max-w-[160px] truncate">{b.blogDns}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">{b.channel}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[180px]">{b.blogUser}</td>
                    <td className="px-4 py-3 text-center"><span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-muted text-xs font-bold">{b.blogPriority}</span></td>
                    <td className="px-4 py-3">{b.enabled
                      ? <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium"><CheckCircle2 className="w-3.5 h-3.5"/> Enabled</span>
                      : <span className="flex items-center gap-1.5 text-xs text-rose-500 font-medium"><PauseCircle className="w-3.5 h-3.5"/> Disabled</span>}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground italic">{fmtShort(b.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Wraps Table ── */}
      {tab === "wraps" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder={`Search ${tabMeta[tab].label.toLowerCase()}...`}
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Origin:</span>
              <select value={originFilter} onChange={e => setOriginFilter(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-border/40 bg-card text-xs font-semibold focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 min-w-[140px] shadow-sm">
                {originList.map(o => (
                  <option key={o} value={o}>{o === "all" ? "All Origins" : o}</option>
                ))}
              </select>
            </div>
          </div>

          {!loading && wrapSort.sorted.length > 0 && (
            <div className="text-xs text-muted-foreground px-1 italic">Found {wrapSort.sorted.length} of {wraps.length} wraps</div>
          )}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/40">
                <TH label="Wrap Host"   col="wrap_host"   sort={wrapSort} />
                <TH label="Prefix"      col="prefix"      sort={wrapSort} />
                <TH label="Target Host" col="target_host" sort={wrapSort} />
                <TH label="Updated"     col="updatedAt"   sort={wrapSort} />
              </tr></thead>
              <tbody>
                {loading ? Array.from({length:5}).map((_,i) => (
                  <tr key={i} className="border-b">{Array.from({length:4}).map((_,j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full"/></td>)}</tr>
                )) : wrapSort.sorted.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground"><Link2 className="w-8 h-8 mx-auto mb-2 opacity-25"/><p>No wraps found</p></td></tr>
                ) : wrapSort.sorted.map(w => (
                  <tr key={w._id} onClick={() => setSelected({ tab: "wraps", data: w })}
                    className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${(selected?.data as Wrap)?._id === w._id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                    <td className="px-4 py-3 font-mono text-xs font-medium">{w.wrap_host}</td>
                    <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 text-xs font-mono font-medium">{w.prefix}</span></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{w.target_host}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground italic">{fmtShort(w.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quotas Tab ── */}
      {tab === "quotas" && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder={`Search ${tabMeta[tab].label.toLowerCase()}...`}
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/40 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm" />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Date:</span>
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border/40 bg-card text-xs font-semibold focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 min-w-[120px] shadow-sm">
                  {dateList.map(d => {
                    let label = d === "all" ? "All Days" : d.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")
                    if (d === todayStr) label = "Today"
                    return <option key={d} value={d}>{label}</option>
                  })}
                </select>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Origin:</span>
                <select value={originFilter} onChange={e => setOriginFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-border/40 bg-card text-xs font-semibold focus:outline-none cursor-pointer focus:ring-2 focus:ring-primary/30 min-w-[140px] shadow-sm">
                  {originList.map(o => (
                    <option key={o} value={o}>{o === "all" ? "All Origins" : o}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/40">
                <TH label="Domain" col="domain" sort={quotaSort} />
                <TH label="Type"   col="type"   sort={quotaSort} />
                <TH label="Key"    col="latest.key" sort={quotaSort} />
                <th className="px-4 py-3 text-left font-bold text-[10px] uppercase tracking-wider text-muted-foreground text-xs font-semibold">Traffic (Posts/Limit)</th>
              </tr></thead>
              <tbody>
                {loading ? Array.from({length:5}).map((_,i) => (
                  <tr key={i} className="border-b">{Array.from({length:4}).map((_,j) => <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full"/></td>)}</tr>
                )) : quotaSort.sorted.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-muted-foreground"><BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-25"/><p>No quotas found for this criteria</p></td></tr>
                ) : quotaSort.sorted.map(g => {
                  const qt = g.latest
                  const pct = qt.limit > 0 ? Math.round((qt.count / qt.limit) * 100) : 0
                  const barColor = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                  const isSelected = (selected?.data as QuotaGroup)?.domain === g.domain
                  return (
                    <tr key={g.domain} onClick={() => setSelected({ tab: "quotas", data: g })}
                      className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                      <td className="px-4 py-3 font-medium text-xs font-mono">{g.domain}</td>
                      <td className="px-4 py-3 shrink-0"><span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${g.type === "origin" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>{g.type}</span></td>
                      <td className="px-4 py-3 text-[10px] font-mono text-muted-foreground truncate max-w-[120px]">{qt.key}</td>
                      <td className="px-4 py-3 min-w-[180px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold tabular-nums">{qt.count} / {qt.limit}</span>
                          <span className="text-[10px] text-muted-foreground">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail slide-over */}
      {selected && (
        <div className="fixed top-0 right-0 h-full w-[400px] bg-background border-l shadow-2xl z-40 animate-in slide-in-from-right duration-300 flex flex-col">
          <div className="p-5 border-b flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                {selected.tab === "blogs" && <BookOpen className="w-5 h-5 text-primary" />}
                {selected.tab === "wraps" && <Link2 className="w-5 h-5 text-primary" />}
                {selected.tab === "quotas" && <BarChart3 className="w-5 h-5 text-primary" />}
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight truncate max-w-[200px]">
                  {selected.tab === "blogs" ? (selected.data as Blog).blogDns :
                   selected.tab === "wraps" ? (selected.data as Wrap).wrap_host :
                   (selected.data as QuotaGroup).domain}
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{selected.tab} detail</p>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {renderDetail()}
          </div>
        </div>
      )}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TH = <T,>({ label, col, sort }: { label: string; col: keyof T | string; sort: any }) => (
  <th className="px-4 py-3 text-left cursor-pointer group hover:bg-muted/50 transition-colors"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onClick={() => sort.toggle(col as any)}>
    <div className="flex items-center gap-2 text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
      {label}
      <sort.Icon col={col} />
    </div>
  </th>
)

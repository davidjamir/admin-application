"use client"

import { useEffect, useState, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ImagePlay, Search, RefreshCcw, Copy, Plus, X, Pencil, Save,
  CheckCircle2, PauseCircle, ChevronUp, ChevronDown, ChevronsUpDown,
  Clock, Layers, Globe
} from "lucide-react"
import { toast } from "sonner"

interface AdItem {
  _id: string
  source: string
  domain: string
  origin: string
  name: string
  content: string
  count: number
  enabled: boolean
  note: string
  priority: number
  createdAt: number
  updatedAt: number
}

type SortKey = keyof Pick<AdItem, "name" | "domain" | "origin" | "source" | "priority" | "enabled">
type SortDir = "asc" | "desc"
const EMPTY_FORM = { name: "", source: "", domain: "", origin: "", content: "", note: "", priority: 0, enabled: true }

export default function AdCreativesPage() {
  const [items, setItems]             = useState<AdItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [fetchedAt, setFetchedAt]     = useState<number | null>(null)
  const [hasMounted, setHasMounted]   = useState(false)
  
  const [websiteOrigins, setWebsiteOrigins] = useState<string[]>([])

  const [search, setSearch]           = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [domainFilter, setDomainFilter] = useState("all")
  const [enabledFilter, setEnabledFilter] = useState<"all"|"enabled"|"disabled">("all")
  const [sortKey, setSortKey]         = useState<SortKey>("name")
  const [sortDir, setSortDir]         = useState<SortDir>("asc")

  // Panel state
  const [selected, setSelected]       = useState<AdItem | null>(null)
  const [editing, setEditing]         = useState(false)
  const [editForm, setEditForm]       = useState<AdItem | null>(null)
  const [saving, setSaving]           = useState(false)

  // Add panel
  const [addOpen, setAddOpen]         = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [submitting, setSubmitting]   = useState(false)

  const fetchData = async (force = false) => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/ad-creatives${force ? "?force=true" : ""}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setItems(data.items || [])
      if (data.fetchedAt) setFetchedAt(data.fetchedAt)
    } catch {
      toast.error("Failed to load Ad Creatives")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchWebsiteOrigins = async () => {
    try {
      const res = await fetch("/api/websites")
      if (!res.ok) return
      const data = await res.json()
      
      // Extract unique origins from blogs, wraps, and quotas
      const origins = new Set<string>()
      
      const getOrigin = (domain: string) => domain.split(".").slice(-2).join(".")
      
      if (data.blogs) data.blogs.forEach((b: any) => origins.add(getOrigin(b.blogDns)))
      if (data.wraps) data.wraps.forEach((w: any) => origins.add(getOrigin(w.target_host)))
      if (data.quotas) {
        data.quotas.forEach((q: any) => {
          if (q.type === 'origin') origins.add(q.domain)
          else origins.add(getOrigin(q.domain))
        })
      }
      
      setWebsiteOrigins(Array.from(origins).sort())
    } catch (err) {
      console.error("Failed to fetch website origins", err)
    }
  }

  useEffect(() => { 
    setHasMounted(true)
    fetchData()
    fetchWebsiteOrigins()
  }, [])

  const sources = useMemo(() =>
    ["all", ...Array.from(new Set(items.map(i => i.source).filter(Boolean)))].sort(),
    [items]
  )

  const domainsInUI = useMemo(() =>
    ["all", ...Array.from(new Set(items.map(i => i.domain).filter(Boolean)))].sort(),
    [items]
  )

  const sorted = useMemo(() => {
    let list = [...items]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.domain.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q) ||
        i.note.toLowerCase().includes(q)
      )
    }
    if (sourceFilter !== "all") list = list.filter(i => i.source === sourceFilter)
    if (domainFilter !== "all") list = list.filter(i => i.domain === domainFilter)
    if (enabledFilter === "enabled")  list = list.filter(i => i.enabled)
    if (enabledFilter === "disabled") list = list.filter(i => !i.enabled)
    
    list.sort((a, b) => {
      const av = a[sortKey] as any, bv = b[sortKey] as any
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return list
  }, [items, search, sourceFilter, domainFilter, enabledFilter, sortKey, sortDir])

  const getSourceStyle = (source: string) => {
    const s = (source || "").toLowerCase();
    if (s.includes("adhub")) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (s.includes("google")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    if (s.includes("manual")) return "bg-slate-500/10 text-slate-700 dark:text-slate-400";
    if (s.includes("fallback")) return "bg-rose-500/10 text-rose-700 dark:text-rose-400";
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText("")
    await navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}`)
  }

  const openDetail = (item: AdItem) => {
    setSelected(item)
    setEditing(false)
    setEditForm(null)
    setAddOpen(false)
  }

  const startEdit = () => {
    if (!selected) return
    setEditForm({ ...selected })
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEditForm(null)
  }

  const saveEdit = async () => {
    if (!editForm) return
    setSaving(true)
    try {
      const res = await fetch("/api/ad-creatives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Saved successfully")
      await fetchData(true)
      setSelected(editForm)
      setEditing(false)
      setEditForm(null)
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.domain || !form.content) {
      toast.error("Name, Domain and Content are required")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/ad-creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Creative added")
      setForm(EMPTY_FORM)
      setAddOpen(false)
      fetchData(true)
    } catch {
      toast.error("Failed to add creative")
    } finally {
      setSubmitting(false)
    }
  }

  const panelOpen = !!selected || addOpen

  return (
    <div className="flex gap-0 h-full relative min-h-[600px]">
      {!hasMounted ? (
        <div className="p-6 flex flex-col gap-6 w-full">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Backdrop */}
          {panelOpen && (
            <div
              className="fixed inset-0 z-30 bg-background/50 backdrop-blur-[2px] animate-in fade-in"
              onClick={() => { setSelected(null); setAddOpen(false); setEditing(false) }}
            />
          )}

          {/* Main content */}
          <div className="flex flex-col gap-5 p-6 flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ImagePlay className="w-5 h-5 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold">Ad Creatives</h1>
                </div>
                {fetchedAt && (
                  <p className="text-xs text-muted-foreground ml-[52px] italic flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    Cached Sync: <span suppressHydrationWarning>{new Date(fetchedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })}</span>
                    <button onClick={async () => { const id = toast.warning("Recrawling...", { duration: Infinity }); await fetchData(true); toast.success("Refreshed", { id }) }} className="cursor-pointer hover:text-foreground transition-colors">
                      <RefreshCcw className="w-3 h-3" />
                    </button>
                  </p>
                )}
              </div>
              <button
                onClick={() => { setSelected(null); setAddOpen(true) }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add Creative
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total",    value: items.length,                                color: "hsl(217,91%,50%)" },
                { label: "Enabled",  value: items.filter(i => i.enabled).length,        color: "hsl(142,71%,40%)" },
                { label: "Disabled", value: items.filter(i => !i.enabled).length,       color: "hsl(0,85%,45%)"   },
                { label: "Sources",  value: new Set(items.map(i => i.source).filter(Boolean)).size, color: "rgb(245, 159, 10)"  },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 p-3.5 rounded-xl border bg-card shadow-sm">
                  <div className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>
                    {loading ? "—" : s.value}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap bg-muted/20 p-2 rounded-xl border border-border/40">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search name, domain, source..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sourceFilter}
                  onChange={e => setSourceFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border bg-card text-xs font-semibold focus:outline-none cursor-pointer min-w-[120px] shadow-sm"
                >
                  {sources.map(s => <option key={s} value={s}>{s === "all" ? "All Sources" : s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={domainFilter}
                  onChange={e => setDomainFilter(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border bg-card text-xs font-semibold focus:outline-none cursor-pointer min-w-[140px] shadow-sm"
                >
                  {domainsInUI.map(d => <option key={d} value={d}>{d === "all" ? "All Domains" : d}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={enabledFilter}
                  onChange={e => setEnabledFilter(e.target.value as any)}
                  className="px-2 py-1.5 rounded-lg border bg-card text-xs font-semibold focus:outline-none cursor-pointer shadow-sm"
                >
                  <option value="all">All Status</option>
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b bg-muted/40 font-bold text-[10px] text-muted-foreground uppercase tracking-wider">
                    <TH label="Name"     col="name"     sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                    <TH label="Source"   col="source"   sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                    <TH label="Domain"   col="domain"   sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                    <TH label="Priority" col="priority" sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                    <TH label="Status"   col="enabled"  sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : sorted.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">
                      <ImagePlay className="w-10 h-10 mx-auto mb-2 opacity-25" />
                      <p>No ad creatives found</p>
                    </td></tr>
                  ) : sorted.map(item => (
                    <tr
                      key={item._id}
                      onClick={() => openDetail(item)}
                      className={`border-b transition-colors cursor-pointer group ${selected?._id === item._id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                    >
                      <td className="px-4 py-3 font-medium truncate max-w-[180px]">{item.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-sm text-xs font-medium uppercase ${getSourceStyle(item.source)}`}>{item.source}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground font-mono truncate max-w-[150px]">{item.domain}</td>
                      <td className="px-4 py-3 text-xs font-medium">
                        {item.priority}
                      </td>
                      <td className="px-4 py-3">
                        {item.enabled
                          ? <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5" /> Enabled</span>
                          : <span className="flex items-center gap-1.5 text-xs text-rose-500 font-medium whitespace-nowrap"><PauseCircle className="w-3.5 h-3.5" /> Disabled</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && (
                <div className="px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between italic">
                  <div className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Showing {sorted.length} of {items.length}</div>
                </div>
              )}
            </div>

            {/* Detail / Edit Panel (Nested inside main content for isolation) */}
            {selected && !addOpen && (
              <div className="fixed top-0 right-0 h-full w-[440px] bg-background border-l shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col z-40">
                <div className="flex items-center justify-between p-5 border-b">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Ad Creative</p>
                    <h2 className="font-bold text-base truncate">{editing ? editForm?.name : selected.name}</h2>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    {!editing && (
                      <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-muted cursor-pointer transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    <button onClick={() => { setSelected(null); setEditing(false) }} className="p-2 hover:bg-muted rounded-full cursor-pointer transition-colors">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {!editing ? (
                    <div className="p-5 space-y-5">
                      <div className="space-y-3">
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Domain
                          </div>
                          <div className="font-medium text-sm truncate">{selected.domain || "—"}</div>
                          {selected.note && (
                            <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{selected.note}</div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50 border">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Source</div>
                            <div className="font-medium text-sm truncate">{selected.source || "—"}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50 border">
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Priority</div>
                            <div className="font-medium text-sm truncate">{selected.priority}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                        {selected.enabled
                          ? <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold"><CheckCircle2 className="w-4 h-4" /> Enabled</span>
                          : <span className="flex items-center gap-1.5 text-sm text-rose-500 font-semibold"><PauseCircle className="w-4 h-4" /> Disabled</span>}
                      </div>

                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ad Code</span>
                          <button onClick={() => copy(selected.content, "Ad Code")} className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        </div>
                        <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto bg-muted/80 p-2 rounded-md border">{selected.content}</pre>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <div className="text-[10px] uppercase tracking-wider mb-1">Created</div>
                          <div className="italic" suppressHydrationWarning>{new Date(selected.createdAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })}</div>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50 border">
                          <div className="text-[10px] uppercase tracking-wider mb-1">Updated</div>
                          <div className="italic" suppressHydrationWarning>{new Date(selected.updatedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name *</label>
                        <input type="text" value={editForm!.name} onChange={e => setEditForm(f => f && ({ ...f, name: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Source</label>
                          <input type="text" value={editForm!.source} onChange={e => setEditForm(f => f && ({ ...f, source: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
                          <input type="number" min={0} value={editForm!.priority} onChange={e => setEditForm(f => f && ({ ...f, priority: Number(e.target.value) }))}
                            className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Domain *</label>
                        <select value={editForm!.domain} onChange={e => setEditForm(f => f && ({ ...f, domain: e.target.value, origin: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none cursor-pointer">
                          <option value="">Select Domain</option>
                          {websiteOrigins.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                          <select value={editForm!.enabled ? "enabled" : "disabled"} onChange={e => setEditForm(f => f && ({ ...f, enabled: e.target.value === "enabled" }))}
                            className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none cursor-pointer">
                            <option value="enabled">Enabled</option>
                            <option value="disabled">Disabled</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</label>
                        <input type="text" value={editForm!.note} onChange={e => setEditForm(f => f && ({ ...f, note: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ad Code *</label>
                        <textarea rows={12} value={editForm!.content} onChange={e => setEditForm(f => f && ({ ...f, content: e.target.value }))}
                          className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed" />
                      </div>
                    </div>
                  )}
                </div>

                {editing && (
                  <div className="p-5 border-t flex gap-3">
                    <button onClick={cancelEdit} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted cursor-pointer transition-colors">
                      Cancel
                    </button>
                    <button onClick={saveEdit} disabled={saving}
                      className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                      {saving ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Add Creative Slide-Over */}
            {addOpen && (
              <div className="fixed top-0 right-0 h-full w-[440px] bg-background border-l shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col z-40">
                <div className="flex items-center justify-between p-5 border-b">
                  <div>
                    <h2 className="font-bold text-base">New Ad Creative</h2>
                  </div>
                  <button onClick={() => setAddOpen(false)} className="p-2 hover:bg-muted rounded-full cursor-pointer transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <form onSubmit={handleAdd} className="flex-1 overflow-y-auto p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name *</label>
                    <input type="text" required placeholder="e.g. responsive 1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Source</label>
                      <input type="text" placeholder="e.g. adhub-media" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
                      <input type="number" min={0} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                        className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Domain *</label>
                    <select required value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value, origin: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none cursor-pointer">
                      <option value="">Select Domain</option>
                      {websiteOrigins.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                      <select value={form.enabled ? "enabled" : "disabled"} onChange={e => setForm(f => ({ ...f, enabled: e.target.value === "enabled" }))}
                        className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none cursor-pointer">
                        <option value="enabled">Enabled</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</label>
                    <input type="text" placeholder="e.g. ADX display" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ad Code *</label>
                    <textarea required rows={10} placeholder={"<script async src=\"...\">\n</script>\n<div id=\"...\">...</div>"} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed" />
                  </div>
                </form>
                <div className="p-5 border-t flex gap-3">
                  <button type="button" onClick={() => setAddOpen(false)} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted cursor-pointer transition-colors">Cancel</button>
                  <button onClick={handleAdd} disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 cursor-pointer transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    {submitting ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Creative</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Shared origins list for inputs */}
      <datalist id="origins-list">
        {websiteOrigins.map(o => <option key={o} value={o} />)}
      </datalist>
    </div>
  )
}

function TH<T>({ label, col, sortKey, sortDir, handleSort }: { label: string; col: keyof T; sortKey: string; sortDir: string; handleSort: (k: any) => void }) {
  const isSorted = sortKey === col
  return (
    <th onClick={() => handleSort(col)}
      className="px-4 py-3 text-left cursor-pointer select-none hover:bg-muted transition-colors group">
      <span className={`flex items-center gap-1.5 ${isSorted ? "text-primary" : ""}`}>
        {label}
        {isSorted ? (
          sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />
        )}
      </span>
    </th>
  )
}

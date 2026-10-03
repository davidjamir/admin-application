"use client"

import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import {
  RefreshCw,
  Globe,
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Search,
  Layers,
  ArrowRight,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface OriginItem {
  origin: string
  totalItems?: number
  icon?: string
}

interface SyncFlags {
  siteconfig: boolean
  adstxt: boolean
  sitemapgeneral: boolean
  sitemappage: boolean
  sitemapcategory: boolean
  robotstxt: boolean
  feedpost: boolean
  latestpost: boolean
}

const DEFAULT_FLAGS: SyncFlags = {
  siteconfig: true,
  adstxt: true,
  sitemapgeneral: true,
  sitemappage: true,
  sitemapcategory: true,
  robotstxt: true,
  feedpost: true,
  latestpost: true,
}

const MODULES: { key: keyof SyncFlags; label: string }[] = [
  { key: "siteconfig", label: "siteconfig" },
  { key: "adstxt", label: "adstxt" },
  { key: "sitemapgeneral", label: "sitemapgeneral" },
  { key: "sitemappage", label: "sitemappage" },
  { key: "sitemapcategory", label: "sitemapcategory" },
  { key: "robotstxt", label: "robotstxt" },
  { key: "feedpost", label: "feedpost" },
  { key: "latestpost", label: "latestpost" },
]

interface LogItem {
  id: string
  timestamp: string
  origin: string
  domain?: string
  url: string
  success: boolean
  status: number
  statusText: string
  durationMs: number
  data?: unknown
  error?: string
}

export function R2SyncView() {
  const [origins, setOrigins] = useState<OriginItem[]>([])
  const [loadingOrigins, setLoadingOrigins] = useState(true)

  // Domains cache per origin: { [origin: string]: string[] }
  const [domainsCache, setDomainsCache] = useState<Record<string, string[]>>({})
  const [loadingDomains, setLoadingDomains] = useState(false)

  // Filtering
  const [originSearch, setOriginSearch] = useState("")
  const [domainSearch, setDomainSearch] = useState("")

  // Selections
  const [selectedOrigin, setSelectedOrigin] = useState<string>("")
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null) // null = all domains

  // Modules
  const [flags, setFlags] = useState<SyncFlags>(DEFAULT_FLAGS)

  // Execution
  const [syncing, setSyncing] = useState(false)
  const [logs, setLogs] = useState<LogItem[]>([])

  // Load origins from collection `origins`
  const loadOrigins = async () => {
    try {
      setLoadingOrigins(true)
      const res = await fetch("/api/r2-sync/origins")
      const json = await res.json()
      if (json.success && Array.isArray(json.origins)) {
        setOrigins(json.origins)
        if (json.origins.length > 0) {
          const first = json.origins[0].origin
          setSelectedOrigin(first)
          setSelectedDomain(null)
          void fetchDomainsForOrigin(first)
        }
      } else {
        toast.error("Failed to load origins: " + (json.error || "Unknown error"))
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error"
      toast.error("Failed to fetch origins: " + msg)
    } finally {
      setLoadingOrigins(false)
    }
  }

  // Fetch domains for a specific origin on-demand from collection `sites`
  const fetchDomainsForOrigin = useCallback(
    async (originName: string) => {
      if (!originName) return
      if (domainsCache[originName]) {
        return // Already cached
      }

      try {
        setLoadingDomains(true)
        const res = await fetch(`/api/r2-sync/domains?origin=${encodeURIComponent(originName)}`)
        const json = await res.json()
        if (json.success && Array.isArray(json.domains)) {
          setDomainsCache((prev) => ({
            ...prev,
            [originName]: json.domains,
          }))
        } else {
          toast.error(`Failed to load domains for ${originName}: ` + (json.error || "Unknown error"))
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Error"
        toast.error(`Failed to load domains: ${msg}`)
      } finally {
        setLoadingDomains(false)
      }
    },
    [domainsCache],
  )

  // Lock outer page scrolling while viewing R2 Sync so columns scroll independently
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  useEffect(() => {
    void loadOrigins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When user clicks an Origin
  const handleSelectOrigin = (originName: string) => {
    setSelectedOrigin(originName)
    setSelectedDomain(null) // reset to All Domains
    setDomainSearch("")
    void fetchDomainsForOrigin(originName)
  }

  // Current origin's domains list
  const currentDomains = useMemo(() => {
    return domainsCache[selectedOrigin] || []
  }, [domainsCache, selectedOrigin])

  // Filtered Origins
  const filteredOrigins = useMemo(() => {
    if (!originSearch.trim()) return origins
    const term = originSearch.toLowerCase().trim()
    return origins.filter((o) => o.origin.toLowerCase().includes(term))
  }, [origins, originSearch])

  // Filtered Domains
  const filteredDomains = useMemo(() => {
    if (!domainSearch.trim()) return currentDomains
    const term = domainSearch.toLowerCase().trim()
    return currentDomains.filter((d) => d.toLowerCase().includes(term))
  }, [currentDomains, domainSearch])

  // Toggle Module
  const toggleFlag = (key: keyof SyncFlags) => {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Module Preset Helpers
  const setAllFlags = (val: boolean) => {
    setFlags({
      siteconfig: val,
      adstxt: val,
      sitemapgeneral: val,
      sitemappage: val,
      sitemapcategory: val,
      robotstxt: val,
      feedpost: val,
      latestpost: val,
    })
  }

  const setOnlyConfigAndAds = () => {
    setFlags({
      siteconfig: true,
      adstxt: true,
      sitemapgeneral: false,
      sitemappage: false,
      sitemapcategory: false,
      robotstxt: false,
      feedpost: false,
      latestpost: false,
    })
  }

  const setOnlySitemapsAndRobots = () => {
    setFlags({
      siteconfig: false,
      adstxt: false,
      sitemapgeneral: true,
      sitemappage: true,
      sitemapcategory: true,
      robotstxt: true,
      feedpost: false,
      latestpost: false,
    })
  }

  // Active Flags Count
  const activeFlagsCount = useMemo(() => {
    return Object.values(flags).filter(Boolean).length
  }, [flags])

  // Request URL Preview
  const requestUrl = useMemo(() => {
    if (!selectedOrigin) return ""
    const params = new URLSearchParams()
    params.set("origin", selectedOrigin)

    if (selectedDomain) {
      params.set("domain", selectedDomain)
    }

    ;(Object.keys(flags) as (keyof SyncFlags)[]).forEach((key) => {
      if (flags[key]) {
        params.set(key, "true")
      }
    })

    return `https://adapter1.vercel.app/api/async-site?${params.toString()}`
  }, [selectedOrigin, selectedDomain, flags])

  const copyUrl = async () => {
    if (!requestUrl) return
    await navigator.clipboard.writeText(requestUrl)
    toast.success("Request URL copied to clipboard")
  }

  // Execute Sync
  const handleSync = async () => {
    if (!selectedOrigin) {
      toast.error("Please select an Origin")
      return
    }

    if (activeFlagsCount === 0) {
      toast.error("Select at least 1 module to sync")
      return
    }

    setSyncing(true)
    const targetLabel = selectedDomain
      ? `${selectedDomain}`
      : `${selectedOrigin} (All Domains)`

    try {
      const res = await fetch("/api/r2-sync/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: selectedOrigin,
          domain: selectedDomain || undefined,
          ...flags,
        }),
      })

      const result = await res.json()

      const newLog: LogItem = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        origin: selectedOrigin,
        domain: selectedDomain || undefined,
        url: result.targetUrl || requestUrl,
        success: result.success ?? false,
        status: result.status ?? (res.ok ? 200 : res.status),
        statusText: result.statusText || (res.ok ? "OK" : "Error"),
        durationMs: result.durationMs ?? 0,
        data: result.data,
        error: result.error,
      }

      setLogs((prev) => [newLog, ...prev])

      if (result.success) {
        toast.success(`Synced ${targetLabel} (${result.durationMs}ms)`)
      } else {
        toast.error(`Sync failed: ${result.error || result.statusText}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed"
      toast.error(msg)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 h-[calc(100dvh-7.5rem)] md:h-[calc(100dvh-7rem)] max-h-[calc(100dvh-7.5rem)] md:max-h-[calc(100dvh-7rem)] w-full gap-3 overflow-hidden overscroll-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            <RefreshCw className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">R2 Sync</h1>
              <Badge variant="outline" className="text-xs font-mono">
                CDN & DB Sync
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Direct sync trigger for Cloudflare R2
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDomainsCache({})
              void loadOrigins()
            }}
            disabled={loadingOrigins}
            className="h-8 text-xs gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingOrigins ? "animate-spin" : ""}`} />
            Refresh Origins
          </Button>
        </div>
      </div>

      {/* 3-Column Full Screen Workspace */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Column 1: Origins List (From collection 'origins') */}
        <div className="md:col-span-2 flex flex-col border rounded-lg bg-card overflow-hidden min-h-0">
          <div className="p-2 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              Origins ({filteredOrigins.length})
            </span>
          </div>

          <div className="p-2 border-b shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (originSearch.trim()) {
                  handleSelectOrigin(originSearch.trim())
                }
              }}
              className="relative flex items-center"
            >
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Type or search origin..."
                value={originSearch}
                onChange={(e) => setOriginSearch(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs"
              />
              {originSearch.trim() && (
                <button
                  type="submit"
                  className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
                  title="Search sites for this origin"
                >
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </form>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-1.5 space-y-1 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {originSearch.trim() &&
              !filteredOrigins.some(
                (o) => o.origin.toLowerCase() === originSearch.trim().toLowerCase(),
              ) && (
                <button
                  type="button"
                  onClick={() => handleSelectOrigin(originSearch.trim())}
                  className="w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors border border-dashed border-primary/50 text-primary bg-primary/5 hover:bg-primary/10 mb-1"
                >
                  <span className="truncate">Use &quot;{originSearch.trim()}&quot;</span>
                  <ArrowRight className="h-3 w-3 shrink-0 ml-1" />
                </button>
              )}

            {loadingOrigins ? (
              <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Loading origins...
              </div>
            ) : filteredOrigins.length === 0 && !originSearch.trim() ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No origins found
              </div>
            ) : (
              filteredOrigins.map((item) => {
                const isSelected = item.origin === selectedOrigin
                return (
                  <button
                    key={item.origin}
                    type="button"
                    onClick={() => handleSelectOrigin(item.origin)}
                    className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors border ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-background text-foreground border-transparent hover:bg-muted/70"
                    }`}
                  >
                    <span className="truncate pr-2">{item.origin}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Column 2: Domains List (Fetched on-demand from collection 'sites') */}
        <div className="md:col-span-3 flex flex-col border rounded-lg bg-card overflow-hidden min-h-0">
          <div className="p-2 border-b bg-muted/30 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Domains ({currentDomains.length})
            </span>
            <div className="flex items-center gap-1.5">
              {loadingDomains && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
              <span className="text-[11px] text-muted-foreground truncate max-w-[140px]">
                {selectedOrigin}
              </span>
            </div>
          </div>

          <div className="p-2 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter domains..."
                value={domainSearch}
                onChange={(e) => setDomainSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
                disabled={!selectedOrigin}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain p-1.5 space-y-1 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {!selectedOrigin ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Select an origin first
              </div>
            ) : (
              <>
                {/* Top Option: All Domains */}
                <button
                  type="button"
                  onClick={() => setSelectedDomain(null)}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-xs font-medium flex items-center justify-between transition-colors border mb-1.5 ${
                    selectedDomain === null
                      ? "bg-primary/10 text-primary border-primary/40 font-semibold"
                      : "bg-muted/40 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        selectedDomain === null ? "bg-primary" : "bg-muted-foreground/50"
                      }`}
                    />
                    <span>All Domains (Origin-wide)</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    Sync All
                  </Badge>
                </button>

                <div className="border-t my-1" />

                {/* Subdomains list loaded from collection sites */}
                {loadingDomains && currentDomains.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Fetching domains from sites...
                  </div>
                ) : filteredDomains.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground">
                    No domains found for this origin
                  </div>
                ) : (
                  filteredDomains.map((dom) => {
                    const isSelected = selectedDomain === dom
                    return (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => setSelectedDomain(dom)}
                        className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-colors border ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs"
                            : "bg-background text-foreground border-transparent hover:bg-muted/70"
                        }`}
                      >
                        <span className="truncate pr-2 font-mono text-[11px]">{dom}</span>
                        {isSelected && <Check className="h-3 w-3 shrink-0" />}
                      </button>
                    )
                  })
                )}
              </>
            )}
          </div>
        </div>

        {/* Column 3: Modules, Preview & Execution Logs */}
        <div className="md:col-span-7 flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Action & Target Header */}
          <div className="p-3 border rounded-lg bg-card flex flex-col gap-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Target
                </span>
                <div className="text-sm font-semibold truncate flex items-center gap-1.5 mt-0.5">
                  <span className="text-foreground">{selectedOrigin || "None"}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={selectedDomain ? "text-primary font-mono text-xs" : "text-emerald-600 dark:text-emerald-400 font-semibold"}>
                    {selectedDomain ? selectedDomain : "ALL DOMAINS"}
                  </span>
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                className="gap-1.5 font-semibold text-xs px-4 h-9 shadow-sm"
                onClick={() => void handleSync()}
                disabled={syncing || !selectedOrigin}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
                {syncing
                  ? "Syncing..."
                  : selectedDomain
                  ? `Sync (${selectedDomain.split(".")[0]})`
                  : `Sync All (${currentDomains.length || 0})`}
              </Button>
            </div>

            {/* Modules Grid */}
            <div className="flex flex-col gap-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Modules ({activeFlagsCount}/8)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setAllFlags(true)}
                    className="text-[10px] font-medium text-primary hover:underline px-1"
                  >
                    All
                  </button>
                  <span className="text-muted-foreground text-[10px]">|</span>
                  <button
                    type="button"
                    onClick={() => setAllFlags(false)}
                    className="text-[10px] font-medium text-muted-foreground hover:underline px-1"
                  >
                    None
                  </button>
                  <span className="text-muted-foreground text-[10px]">|</span>
                  <button
                    type="button"
                    onClick={setOnlyConfigAndAds}
                    className="text-[10px] font-medium text-muted-foreground hover:underline px-1"
                  >
                    Config/Ads
                  </button>
                  <span className="text-muted-foreground text-[10px]">|</span>
                  <button
                    type="button"
                    onClick={setOnlySitemapsAndRobots}
                    className="text-[10px] font-medium text-muted-foreground hover:underline px-1"
                  >
                    Sitemaps
                  </button>
                </div>
              </div>

              {/* 8 Clickable Module Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {MODULES.map((item) => {
                  const active = flags[item.key]
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => toggleFlag(item.key)}
                      className={`px-2 py-1.5 rounded-md text-[11px] font-mono font-medium transition-all text-left flex items-center justify-between border select-none ${
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                          : "bg-background text-muted-foreground border-border hover:bg-muted/60"
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {active ? (
                        <Check className="h-3 w-3 shrink-0 ml-1 opacity-90" />
                      ) : (
                        <span className="h-3 w-3 shrink-0 ml-1 text-muted-foreground/40 text-[9px] text-center leading-3">
                          -
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Request Preview */}
            <div className="flex flex-col gap-1 pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  GET Request URL
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => void copyUrl()}
                    disabled={!requestUrl}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy className="h-2.5 w-2.5" />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => window.open(requestUrl, "_blank")}
                    disabled={!requestUrl}
                    className="text-[10px] text-muted-foreground hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    Open
                  </button>
                </div>
              </div>
              <div className="p-2 bg-muted/60 border rounded font-mono text-[11px] text-muted-foreground break-all select-all leading-relaxed max-h-16 overflow-y-auto overscroll-contain no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {requestUrl || "Select an origin to generate request"}
              </div>
            </div>
          </div>

          {/* Execution Logs Console */}
          <div className="flex-1 flex flex-col border rounded-lg bg-card overflow-hidden min-h-0">
            <div className="p-2 border-b bg-muted/30 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Sync History ({logs.length})
              </span>
              {logs.length > 0 && (
                <button
                  type="button"
                  onClick={() => setLogs([])}
                  className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1.5 no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {logs.length === 0 ? (
                <div className="h-full min-h-[140px] flex flex-col items-center justify-center text-xs text-muted-foreground border border-dashed rounded p-4 text-center">
                  <span>No sync history yet</span>
                  <span className="text-[10px] text-muted-foreground/70 mt-1">
                    Press Sync to send request to adapter server
                  </span>
                </div>
              ) : (
                logs.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2 rounded border text-xs flex flex-col gap-1 transition-all ${
                      item.success
                        ? "bg-emerald-500/5 border-emerald-500/30"
                        : "bg-destructive/5 border-destructive/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        {item.success ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
                        )}
                        <span className="font-semibold text-foreground truncate">
                          {item.origin}
                          {item.domain ? ` / ${item.domain}` : " (All Domains)"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={item.success ? "outline" : "destructive"}
                          className="text-[9px] px-1 py-0 h-3.5"
                        >
                          {item.status || (item.success ? "200" : "ERR")}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {item.durationMs}ms
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>

                    {item.error ? (
                      <div className="text-[10px] font-mono text-destructive bg-destructive/10 p-1 rounded break-all">
                        {item.error}
                      </div>
                    ) : item.data && typeof item.data === "object" && !Array.isArray(item.data) && (item.data as Record<string, unknown>).message ? (
                      <div className="text-[10px] font-mono text-muted-foreground bg-muted/40 p-1 rounded">
                        {String((item.data as Record<string, unknown>).message)}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

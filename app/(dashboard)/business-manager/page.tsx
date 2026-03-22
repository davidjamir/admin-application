"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Briefcase, Search, RefreshCcw, Copy, ExternalLink,
  Users, CreditCard, BarChart3, AlertCircle, CheckCircle2, Clock
} from "lucide-react"
import { toast } from "sonner"

interface BusinessManager {
  _id: string
  bmId: string
  name: string
  status: "active" | "restricted" | "disabled" | string
  ownerName?: string
  ownerEmail?: string
  adAccountCount?: number
  pageCount?: number
  systemUserCount?: number
  createdAt?: number
  timezone?: string
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active:      { label: "Active",      color: "hsl(142, 71%, 40%)", icon: CheckCircle2 },
  restricted:  { label: "Restricted",  color: "hsl(38,  92%, 50%)", icon: AlertCircle  },
  disabled:    { label: "Disabled",    color: "hsl(0,   85%, 45%)", icon: AlertCircle  },
}

export default function BusinessManagerPage() {
  const [bms, setBms] = useState<BusinessManager[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (force = false) => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/business-managers${force ? "?force=true" : ""}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setBms(Array.isArray(data) ? data : data.items || [])
    } catch (e) {
      toast.error("Failed to load Business Managers")
      // Fallback mock data for empty/dev environments
      setBms([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = bms.filter(bm =>
    bm.name?.toLowerCase().includes(search.toLowerCase()) ||
    bm.bmId?.toLowerCase().includes(search.toLowerCase())
  )

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText("")
    await navigator.clipboard.writeText(text)
    toast.success(`Copied ${label} to clipboard`)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Business Manager</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-[52px]">
            Manage all Facebook Business Manager accounts and their linked assets.
          </p>
        </div>
        <button
          onClick={async () => {
            const toastId = toast.loading("Recrawling BM data...")
            await fetchData(true)
            toast.success("Data refreshed", { id: toastId })
          }}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-card hover:bg-muted transition-colors text-sm font-medium cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card border-l-[3px]" style={{ borderLeftColor: "hsl(142, 71%, 40%)" }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-500/10">
              <Briefcase className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "hsl(142, 71%, 40%)" }}>
                {loading ? "—" : bms.filter(b => b.status === "active").length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Active BMs</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-[3px]" style={{ borderLeftColor: "hsl(38, 92%, 50%)" }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "hsl(38, 92%, 50%)" }}>
                {loading ? "—" : bms.filter(b => b.status === "restricted").length}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Restricted</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-l-[3px]" style={{ borderLeftColor: "hsl(0, 85%, 45%)" }}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-rose-500/10">
              <BarChart3 className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "hsl(0, 85%, 45%)" }}>
                {loading ? "—" : bms.reduce((acc, b) => acc + (b.adAccountCount || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Ad Accounts</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by BM name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* BM List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border border-dashed rounded-xl bg-muted/20">
          <Briefcase className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium">No Business Managers found</p>
          <p className="text-sm mt-1">
            {bms.length === 0 ? "No data available from the database yet." : "No results match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(bm => {
            const statusCfg = statusConfig[bm.status] || { label: bm.status, color: "hsl(0, 0%, 50%)", icon: AlertCircle }
            const StatusIcon = statusCfg.icon
            return (
              <Card 
                key={bm._id} 
                className="bg-card overflow-hidden border"
                style={{ borderTopColor: statusCfg.color, borderTopWidth: "3px" }}
              >
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{bm.name}</CardTitle>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-muted-foreground font-mono">{bm.bmId}</span>
                        <button
                          onClick={() => copyToClipboard(bm.bmId, "BM ID")}
                          className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                          title="Copy BM ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0"
                      style={{ color: statusCfg.color, borderColor: `${statusCfg.color}40`, backgroundColor: `${statusCfg.color}10` }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusCfg.label}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="grid grid-cols-3 gap-3 mt-2 mb-3">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold">{bm.adAccountCount ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Ad Accounts</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold">{bm.pageCount ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">Pages</div>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="text-lg font-bold">{bm.systemUserCount ?? 0}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">System Users</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3 h-3" />
                      <span>{bm.ownerName || "Unknown owner"}</span>
                    </div>
                    {bm.createdAt && (
                      <div className="flex items-center gap-1 italic">
                        <Clock className="w-3 h-3" />
                        {new Date(bm.createdAt).toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium" })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Briefcase, 
  Search, 
  RefreshCcw, 
  Loader2,
  ShieldCheck,
  User,
  Shield,
  Layers,
  Activity,
  AlertTriangle,
  FileText
} from "lucide-react"
import { facebookService } from "@/services/facebook.service"
import { FacebookBusiness, FacebookPage, SystemUser } from "@/types/facebook"
import BusinessAssetCard from "./BusinessAssetCard"
import BulkActionsHub from "./BulkActionsHub"
import { cn } from "@/lib/utils"

type Props = { adminPassword: string; isAdminVerified: boolean }

type BusinessRow = FacebookBusiness & {
  pages: FacebookPage[]
  assignedPageIds: string[]
}

export default function AssetExplorer({ adminPassword, isAdminVerified }: Props) {
  const [mode, setMode] = useState<"system-user" | "account-user">("system-user")
  const [status, setStatus] = useState("Awaiting context selection...")
  const [loading, setLoading] = useState(false)
  
  // Data State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [businesses, setBusinesses] = useState<FacebookBusiness[]>([])
  const [businessRows, setBusinessRows] = useState<BusinessRow[]>([])
  const [standalonePages, setStandalonePages] = useState<FacebookPage[]>([])
  
  // Selection State
  const [activeViewerToken, setActiveViewerToken] = useState("")
  const [activeViewerId, setActiveViewerId] = useState("")
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
  
  const loadSystemUsers = useCallback(async (password: string) => {
    try {
      const res = await fetch("/api/database/systemUsers/secure-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSystemUsers(data.data ?? [])
    } catch (err) {
      toast.error("Identity sync failed")
    }
  }, [])

  useEffect(() => {
    if (!isAdminVerified) return
    void loadSystemUsers(adminPassword)
  }, [isAdminVerified, adminPassword, loadSystemUsers])

  const handleFetchAssets = async (token: string, userId: string) => {
    if (!token) return
    try {
      setLoading(true)
      setSelectedPageIds([])
      setActiveViewerToken(token)
      setActiveViewerId(userId)
      setStatus(`Crawling architectural nodes for ${userId}...`)

      if (mode === "system-user") {
        // Mode 1: Fetch pages directly from the user token
        const pages = await facebookService.getPages(token)
        setStandalonePages(pages)
        setBusinessRows([])
        setStatus(`Discovered ${pages.length} assets via Identity Token.`)
      } else {
        // Mode 2: Fetch BM assets using account token
        const bms = await facebookService.getBusinesses(token)
        setBusinesses(bms)
        
        const rows = await Promise.all(bms.map(async (bm) => {
          const pages = await facebookService.getBusinessPages(token, bm.id)
          const pageIds = pages.map(p => p.id)
          const assignedPageIds = await facebookService.getAssignedPageIdsInBusinessBatch(token, bm.id, userId, pageIds)
          return {
            ...bm,
            pages,
            assignedPageIds
          }
        }))
        
        setBusinessRows(rows)
        setStandalonePages([])
        setStatus(`Synchronized ${rows.length} Business Nodes.`)
      }
      toast.success("Asset pool synchronized")
    } catch (err) {
      toast.error("Discovery failed. Check token authority.")
      setStatus("Discovery protocol rejected.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
      <div className="space-y-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden border-t-primary/20">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl tracking-tight">Asset Management Explorer</CardTitle>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Activity className="w-3 h-3 text-primary animate-pulse" />
                    <p className="text-[10px] font-medium text-muted-foreground tracking-widest">{status}</p>
                  </div>
                </div>
              </div>

              <Tabs 
                value={mode} 
                onValueChange={(v) => {
                  setMode(v as any)
                  setBusinessRows([])
                  setStandalonePages([])
                  setSelectedPageIds([])
                  setActiveViewerToken("")
                  setActiveViewerId("")
                  setStatus("Mode switched. Awaiting identity selection.")
                }} 
                className="w-full md:w-auto"
              >
                <TabsList className="bg-background/50 border border-border/50 p-1 h-10">
                  <TabsTrigger value="system-user" className="text-xs gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">System User</span>
                  </TabsTrigger>
                  <TabsTrigger value="account-user" className="text-xs gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Account User</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="flex flex-wrap items-center gap-4 mb-8">
               <div className="flex flex-col gap-1.5 min-w-[280px]">
                  <label className="text-[10px] font-bold tracking-widest text-muted-foreground ml-1">Identity Authority</label>
                  <select 
                    className="h-11 rounded-xl border border-border/50 bg-background/50 px-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all cursor-pointer"
                    onChange={(e) => {
                      const user = systemUsers.find(u => u.id === e.target.value)
                      if (user) handleFetchAssets(user.token || "", user.id)
                    }}
                    value={activeViewerId}
                  >
                    <option value="">Select identity to scan...</option>
                    {systemUsers.map(u => (
                       <option key={u.id} value={u.id}>{u.name} ({u.id})</option>
                    ))}
                  </select>
               </div>
               
               <div className="flex items-end h-11 pb-1">
                  {loading && (
                    <div className="flex items-center gap-2 text-primary animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] font-bold tracking-widest">Protocol sync in progress...</span>
                    </div>
                  )}
               </div>

               <div className="ml-auto flex items-end">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-11 px-4 border-border/50 bg-background/50 text-[10px] font-bold tracking-widest"
                    onClick={() => {
                        const user = systemUsers.find(u => u.id === activeViewerId)
                        if (user) handleFetchAssets(user.token || "", user.id)
                    }}
                    disabled={!activeViewerId || loading}
                  >
                    <RefreshCcw className="w-3.5 h-3.5 mr-2" /> Re-scan Assets
                  </Button>
               </div>
            </div>

            {/* Asset Display Area */}
            <div className="space-y-4 min-h-[400px]">
              {mode === "system-user" ? (
                standalonePages.length > 0 ? (
                  <div className="rounded-2xl border border-border/40 bg-background/30 overflow-hidden">
                     <BusinessAssetCard 
                        business={{ id: "SYSTEM_INTERNAL", name: "Internal Identity Assets", pages: standalonePages, assignedPageIds: standalonePages.map(p => p.id) } as any}
                        selectedPageIds={selectedPageIds}
                        onSelectionChange={setSelectedPageIds}
                        activeViewerId={activeViewerId}
                        activeToken={activeViewerToken}
                     />
                  </div>
                ) : !loading && (
                  <EmptyState mode="System User" />
                )
              ) : (
                businessRows.length > 0 ? (
                  businessRows.map(row => (
                    <BusinessAssetCard 
                      key={row.id}
                      business={row}
                      selectedPageIds={selectedPageIds}
                      onSelectionChange={setSelectedPageIds}
                      activeViewerId={activeViewerId}
                      activeToken={activeViewerToken}
                    />
                  ))
                ) : !loading && (
                  <EmptyState mode="Account User" />
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Hub Sidebar */}
      <div className="xl:sticky xl:top-6 h-fit">
        <BulkActionsHub 
          selectedPageIds={selectedPageIds}
          activeToken={activeViewerToken}
          activeViewerId={activeViewerId}
          businesses={businesses}
          systemUsers={systemUsers}
          onSuccess={() => {
              const user = systemUsers.find(u => u.id === activeViewerId)
              if (user) handleFetchAssets(user.token || "", user.id)
          }}
        />
      </div>
    </div>
  )
}

function EmptyState({ mode }: { mode: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 opacity-20 text-center px-8">
      <div className="p-5 bg-muted rounded-full mb-6">
        <Layers className="w-16 h-16" />
      </div>
      <div className="max-w-xs space-y-2">
        <h3 className="text-sm font-bold tracking-widest">Architectural Registry Empty</h3>
        <p className="text-[10px] tracking-tight leading-relaxed">Select a validated identity node to discover assets linked via {mode} protocol.</p>
      </div>
    </div>
  )
}

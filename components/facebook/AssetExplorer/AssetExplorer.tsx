'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  RefreshCcw, 
  Search, 
  Layers, 
  Loader2, 
  Copy, 
  Database, 
  ExternalLink,
  Users,
  Briefcase,
  AlertCircle
} from "lucide-react"
import { facebookService } from "@/services/facebook.service"
import { FacebookBusiness, FacebookPage, SystemUser } from "@/types/facebook"
import { cn } from "@/lib/utils"
import BusinessAssetCard from "./BusinessAssetCard"
import BulkActionsHub from "./BulkActionsHub"

type SourceMode = "system-user" | "account-user"
type BusinessPageRow = FacebookPage & {
  businessId: string
  businessName: string
  pageSource: "owned" | "client"
}

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function AssetExplorer({ adminPassword, isAdminVerified }: Props) {
  const [status, setStatus] = useState("Select identity to explore assets.")
  const [mode, setMode] = useState<SourceMode>("system-user")
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [selectedBmFilter, setSelectedBmFilter] = useState("all")
  const [selectedSystemUserId, setSelectedSystemUserId] = useState("")
  const [accountTokenInput, setAccountTokenInput] = useState("")
  
  const [loadingData, setLoadingData] = useState(false)
  const [businesses, setBusinesses] = useState<FacebookBusiness[]>([])
  const [businessPages, setBusinessPages] = useState<BusinessPageRow[]>([])
  const [assignedPageIdsByBusiness, setAssignedPageIdsByBusiness] = useState<Record<string, string[]>>({})
  const [allManagedPages, setAllManagedPages] = useState<FacebookPage[]>([])
  const [outsidePages, setOutsidePages] = useState<FacebookPage[]>([])
  const [activeViewerId, setActiveViewerId] = useState("")

  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
  const lastCrawledTokenRef = useRef<string>("")

  const loadSystemUsers = useCallback(async (password: string) => {
    try {
        const res = await fetch("/api/database/systemUsers/secure-list", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || "Cloud sync failed")
        setSystemUsers(data.data ?? [])
    } catch (err) {
        toast.error("Personnel sync failed")
    }
  }, [])

  useEffect(() => {
    if (isAdminVerified && adminPassword) {
      void loadSystemUsers(adminPassword)
    }
  }, [isAdminVerified, adminPassword, loadSystemUsers])

  const bmFilterOptions = useMemo(() => {
    const seen = new Set<string>()
    return systemUsers
      .map((u) => ({ id: (u.businessId ?? "").trim(), name: (u.businessName ?? "—").trim() || "—" }))
      .filter((bm) => bm.id && !seen.has(bm.id) && seen.add(bm.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [systemUsers])

  const filteredSystemUsers = useMemo(() => {
    if (selectedBmFilter === "all") return systemUsers
    return systemUsers.filter((u) => (u.businessId ?? "").trim() === selectedBmFilter)
  }, [systemUsers, selectedBmFilter])

  const selectedSystemUser = systemUsers.find((u) => u.id === selectedSystemUserId)
  
  const activeToken = useMemo(() => {
    if (!isAdminVerified) return ""
    if (mode === "system-user") return selectedSystemUser?.token ?? ""
    return accountTokenInput.trim()
  }, [isAdminVerified, mode, selectedSystemUser?.token, accountTokenInput])

  const businessRows = useMemo(() => {
    return businesses.map((bm) => ({
      ...bm,
      pages: businessPages.filter((p) => p.businessId === bm.id),
      assignedPageIds: assignedPageIdsByBusiness[bm.id] ?? []
    })).sort((a, b) => b.pages.length - a.pages.length)
  }, [businesses, businessPages, assignedPageIdsByBusiness])

  const crawlAssets = async (token: string) => {
    try {
      setLoadingData(true)
      setStatus("Crawl initiated: Discovering nodes...")
      
      const [me, bms, managedPages] = await Promise.all([
        facebookService.getMe(token),
        facebookService.getBusinesses(token),
        facebookService.getPages(token)
      ])

      // Fetch roles and assets for each BM
      const businessData = await Promise.all(bms.map(async (bm) => {
        try {
          const [roles, owned, client] = await Promise.all([
            facebookService.getBusinessRolesForUser(token, bm.id, me.id),
            facebookService.getBusinessPages(token, bm.id),
            facebookService.getBusinessClientPages(token, bm.id).catch(() => [])
          ])
          
          const uniquePages = Array.from(new Map([...owned, ...client].map(p => [p.id, p])).values())
          const pagesInBm = uniquePages.map(p => p.id)
          
          const assignedIds = pagesInBm.length > 0 
            ? await facebookService.getAssignedPageIdsInBusinessBatch(token, bm.id, me.id, pagesInBm)
            : []

          return {
            bm: { ...bm, permitted_roles: roles.length > 0 ? roles : (bm.permitted_roles ?? []) },
            pages: uniquePages.map(p => ({
              ...p,
              businessId: bm.id,
              businessName: bm.name,
              pageSource: owned.some(o => o.id === p.id) ? ("owned" as const) : ("client" as const)
            })),
            assignedIds
          }
        } catch (e) {
          return { bm: { ...bm, permitted_roles: bm.permitted_roles ?? [] }, pages: [], assignedIds: [] }
        }
      }))

      const allBmPages = businessData.flatMap(d => d.pages)
      const bmPageIdSet = new Set(allBmPages.map(p => p.id))
      const extraPages = managedPages.filter(p => !bmPageIdSet.has(p.id))
      
      const assignedMap: Record<string, string[]> = {}
      businessData.forEach(d => assignedMap[d.bm.id] = d.assignedIds)

      setBusinesses(businessData.map(d => d.bm))
      setBusinessPages(allBmPages)
      setAssignedPageIdsByBusiness(assignedMap)
      setAllManagedPages(managedPages)
      setOutsidePages(extraPages)
      setActiveViewerId(me.id)
      setSelectedPageIds([])
      setStatus("Discovery finalized.")
      lastCrawledTokenRef.current = token
      toast.success("Identity assets synchronized")
    } catch (err) {
      toast.error("Cloud discovery failed")
      setStatus("Synchronization error. Validate token scope.")
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (!isAdminVerified || !activeToken || mode === "system-user") return
    if (lastCrawledTokenRef.current === activeToken) return
    
    const timer = setTimeout(() => void crawlAssets(activeToken), 1000)
    return () => clearTimeout(timer)
  }, [activeToken, isAdminVerified, mode])

  return (
    <div className="space-y-6">
      {/* Discovery Header */}
      <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Discovery Controller</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono opacity-60">
                    Mode: {mode.replace('-', ' ')} • Status: {status}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border/50">
                <Button 
                  size="sm" 
                  variant={mode === "system-user" ? "secondary" : "ghost"}
                  onClick={() => setMode("system-user")}
                  className="h-8 text-[11px] font-bold px-4"
                >
                  System User
                </Button>
                <Button 
                  size="sm" 
                  variant={mode === "account-user" ? "secondary" : "ghost"}
                  onClick={() => setMode("account-user")}
                  className="h-8 text-[11px] font-bold px-4"
                >
                  Account User
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
              {mode === "system-user" ? (
                <>
                  <Select value={selectedBmFilter} onValueChange={setSelectedBmFilter}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="All Business Managers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Global (All BMs)</SelectItem>
                      {bmFilterOptions.map(bm => <SelectItem key={bm.id} value={bm.id}>{bm.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={selectedSystemUserId} onValueChange={setSelectedSystemUserId}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select Identity User..." />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSystemUsers.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} • {u.businessName || "No BM"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={() => void crawlAssets(activeToken)} 
                    disabled={loadingData || !activeToken}
                    className="cursor-pointer"
                  >
                    {loadingData ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                    Sync Assets
                  </Button>
                </>
              ) : (
                <div className="col-span-3 flex gap-3">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={accountTokenInput}
                      onChange={(e) => setAccountTokenInput(e.target.value)}
                      placeholder="Input Account Access Token (EAAG...)"
                      className="pl-9 bg-background/50 border-border/50"
                    />
                  </div>
                  <Button 
                    onClick={() => void crawlAssets(accountTokenInput)} 
                    disabled={loadingData || !accountTokenInput.trim()}
                    className="cursor-pointer px-6"
                  >
                    {loadingData ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                    Discover
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Grid & Bulk Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {loadingData ? (
             <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed border-border/50 rounded-2xl gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary opacity-20" />
                <p className="text-xs font-mono text-muted-foreground animate-pulse">Establishing Node Connections...</p>
             </div>
          ) : businessRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-muted/20 border border-dashed border-border/50 rounded-2xl gap-4 opacity-40">
                <Layers className="w-12 h-12" />
                <div className="text-center">
                  <p className="text-sm font-bold uppercase tracking-widest">No Active Nodes</p>
                  <p className="text-[10px] mt-1">Initiate discovery to explore business architecture.</p>
                </div>
            </div>
          ) : (
            businessRows.map(row => (
              <BusinessAssetCard 
                key={row.id}
                business={row}
                selectedPageIds={selectedPageIds}
                onSelectionChange={setSelectedPageIds}
                activeViewerId={activeViewerId}
                activeToken={activeToken}
              />
            ))
          )}

          {outsidePages.length > 0 && (
             <BusinessAssetCard 
                business={{ id: "outside", name: "Extra Assets (Unassociated)", pages: outsidePages as any, assignedPageIds: [] }}
                selectedPageIds={selectedPageIds}
                onSelectionChange={setSelectedPageIds}
                activeViewerId={activeViewerId}
                activeToken={activeToken}
             />
          )}
        </div>

        <div className="space-y-6">
           <BulkActionsHub 
             selectedPageIds={selectedPageIds}
             activeToken={activeToken}
             activeViewerId={activeViewerId}
             businesses={businesses}
             systemUsers={systemUsers}
             onSuccess={() => void crawlAssets(activeToken)}
           />
        </div>
      </div>
    </div>
  )
}

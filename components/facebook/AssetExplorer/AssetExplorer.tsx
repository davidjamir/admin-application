'use client'

import { useCallback, useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Tabs, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { 
  RefreshCcw, 
  Loader2,
  User,
  Shield,
  Layers,
  Copy,
  Trash2,
  Pencil
} from "lucide-react"
import { facebookService } from "@/services/facebook.service"
import { FacebookBusiness, FacebookPage, SystemUser } from "@/types/facebook"
import BusinessAssetCard from "./BusinessAssetCard"
import BulkActionsHub from "./BulkActionsHub"
import PageEditModal from "./PageEditModal"


type Props = { adminPassword: string; isAdminVerified: boolean }

type BusinessRow = FacebookBusiness & {
  pages: FacebookPage[]
  assignedPageIds: string[]
}

export default function AssetExplorer({ adminPassword, isAdminVerified }: Props) {
  const [mode, setMode] = useState<"system-user" | "account-user">("system-user")
  const [loading, setLoading] = useState(false)
  
  // Data State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [businesses, setBusinesses] = useState<FacebookBusiness[]>([])
  const [businessRows, setBusinessRows] = useState<BusinessRow[]>([])
  const [standalonePages, setStandalonePages] = useState<FacebookPage[]>([])
  
  // Selection State
  const [activeViewerToken, setActiveViewerToken] = useState("")
  const [activeViewerId, setActiveViewerId] = useState("")
  const [manualToken, setManualToken] = useState("")
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<FacebookPage | null>(null)

  // Clear data when switching modes
  useEffect(() => {
    setBusinessRows([])
    setStandalonePages([])
    setActiveViewerToken("")
    setActiveViewerId("")
  }, [mode])
  
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
    } catch {
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

      if (mode === "system-user") {
        // Mode 1: Fetch pages directly from the user token
        const pages = await facebookService.getPages(token)
        setStandalonePages(pages)
        setBusinessRows([])
      } else {
        // Mode 2: Fetch BM assets using account token
        const bms = await facebookService.getBusinesses(token)
        setBusinesses(bms)
        
        const rows = await Promise.all(bms.map(async (bm) => {
          const [ownedPages, clientPages] = await Promise.all([
            facebookService.getBusinessPages(token, bm.id),
            facebookService.getBusinessClientPages(token, bm.id).catch(() => [] as FacebookPage[])
          ])
          
          // Merge and deduplicate pages by ID
          const allPages = [...ownedPages, ...clientPages]
          const uniquePages = Array.from(new Map(allPages.map(p => [p.id, p])).values())
          
          const pageIds = uniquePages.map(p => p.id)
          const assignedPageIds = await facebookService.getAssignedPageIdsInBusinessBatch(token, bm.id, userId, pageIds)
          return {
            ...bm,
            pages: uniquePages,
            assignedPageIds
          }
        }))
        
        setBusinessRows(rows)
        setStandalonePages([])
      }
      toast.success("Asset pool synchronized")
    } catch {
      toast.error("Discovery failed. Check token authority.")
    } finally {
      setLoading(false)
    }
  }

  const handleManualSync = async () => {
    if (!manualToken.trim()) {
      toast.error("Please provide an Access Token")
      return
    }
    
    try {
      setLoading(true)
      const me = await facebookService.getMe(manualToken.trim())
      toast.success(`Identity Verified: ${me.name}`)
      await handleFetchAssets(manualToken.trim(), me.id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Manual sync failed")
    } finally {
      setLoading(false)
    }
  }

  const [selectedBmFilter, setSelectedBmFilter] = useState("all")
  const [selectedSystemAdminId, setSelectedSystemAdminId] = useState("")

  // BM Filter Options for System User Mode
  const bmFilterOptions = useMemo(() => {
    const seen = new Set<string>()
    return systemUsers
      .map((u) => ({ id: (u.businessId ?? "").trim(), name: (u.businessName ?? "—").trim() || "—" }))
      .filter((bm) => bm.id && !seen.has(bm.id) && seen.add(bm.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [systemUsers])

  const filteredSystemUsers = useMemo(() => {
    const activeUsers = systemUsers.filter((u) => (u.status || "Active") === "Active")
    if (selectedBmFilter === "all") return activeUsers
    return activeUsers.filter((u) => (u.businessId ?? "").trim() === selectedBmFilter)
  }, [systemUsers, selectedBmFilter])

  const handleCopyUserToken = () => {
    if (activeViewerToken) {
      navigator.clipboard.writeText(activeViewerToken)
      toast.success("Access Token copied")
    }
  }

  const activeSystemUser = useMemo(() => {
    return systemUsers.find(u => u.id === activeViewerId)
  }, [systemUsers, activeViewerId])

  const availableAdmins = useMemo(() => {
    if (!activeSystemUser) return []
    
    // Identity must be Active and Admin
    const activeAdmins = systemUsers.filter(u => (u.status || "Active") === "Active" && (u.role || "").toLowerCase() === "admin")
    
    if ((activeSystemUser.role || "").toLowerCase() === "admin") {
      return [activeSystemUser]
    }
    // Filter admins for this BM and App
    return activeAdmins.filter(u => 
      u.businessId === activeSystemUser.businessId && 
      u.appName === activeSystemUser.appName
    )
  }, [systemUsers, activeSystemUser])

  // Effect to auto-select admin
  useEffect(() => {
    if (!activeSystemUser) {
      setSelectedSystemAdminId("")
      return
    }

    const role = (activeSystemUser.role || "").toLowerCase()
    if (role === "admin") {
      setSelectedSystemAdminId(activeSystemUser.id)
    } else if (role === "employee") {
      const currentAdminValid = availableAdmins.some(a => a.id === selectedSystemAdminId)
      if (!currentAdminValid) {
        setSelectedSystemAdminId(availableAdmins.length > 0 ? availableAdmins[0].id : "")
      }
    } else {
      setSelectedSystemAdminId("")
    }
  }, [activeSystemUser, availableAdmins, selectedSystemAdminId])

  return (
    <div className="flex flex-col gap-6 w-full transition-all">
      <div className="w-full space-y-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden border-t-primary/20">
          <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl tracking-tight">Asset Management Explorer</CardTitle>
                  <p className="text-[10px] font-medium text-muted-foreground tracking-widest">
                    Loaded {systemUsers.length} system user(s).
                  </p>
                </div>
              </div>

              <Tabs 
                value={mode} 
                onValueChange={(v: string) => {
                  setMode(v as "system-user" | "account-user")
                  setBusinessRows([])
                  setStandalonePages([])
                  setSelectedPageIds([])
                  setActiveViewerToken("")
                  setActiveViewerId("")
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
            {mode === "system-user" ? (
              <div className="space-y-6">
                {/* System User Filters Row */}
                <div className="flex flex-wrap items-center gap-3">
                  <select 
                    className="h-10 w-[160px] rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-black focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all cursor-pointer shrink-0"
                    value={selectedBmFilter}
                    onChange={(e) => {
                      setSelectedBmFilter(e.target.value)
                      setActiveViewerId("")
                    }}
                  >
                    <option value="all">All Business</option>
                    {bmFilterOptions.map(bm => (
                      <option key={bm.id} value={bm.id}>{bm.name}</option>
                    ))}
                  </select>

                  <select 
                    className="h-10 flex-1 rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-black focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all cursor-pointer min-w-[300px]"
                    onChange={(e) => {
                      const user = systemUsers.find(u => u.id === e.target.value)
                      if (user) handleFetchAssets(user.token || "", user.id)
                    }}
                    value={activeViewerId}
                  >
                    <option value="">Select system user (name • app • id)</option>
                    {filteredSystemUsers.map(u => (
                       <option key={u.id} value={u.id}>{u.name} • {u.appName || "Standard"} • {u.id}</option>
                    ))}
                  </select>
 
                   <div className="flex items-center gap-2 w-[200px] shrink-0 justify-end">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10 rounded-lg hover:bg-primary/10 transition-all cursor-pointer"
                      onClick={handleCopyUserToken}
                      disabled={!activeViewerToken}
                    >
                      <Copy className="w-4 h-4 text-primary" />
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`h-10 px-5 rounded-lg border-border/50 hover:bg-primary/10 transition-all cursor-pointer gap-2 ${loading ? "border-green-600/50 bg-green-50 text-green-600" : ""}`}
                      onClick={() => {
                          const user = systemUsers.find(u => u.id === activeViewerId)
                          if (user) handleFetchAssets(user.token || "", user.id)
                          else void loadSystemUsers(adminPassword)
                      }}
                      disabled={loading}
                    >
                      <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-green-600" : ""}`} />
                      <span className="text-sm">Refresh</span>
                    </Button>
                  </div>
                </div>

                {/* System Admin selection row */}
                <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm font-medium text-black/60 w-[160px] shrink-0 tracking-tight text-right pr-3">System User Admin</label>
                    <div className="flex-1 flex flex-col gap-1.5 min-w-[300px]">
                      {activeSystemUser && ((activeSystemUser.role || "").toLowerCase() === "admin" || ((activeSystemUser.role || "").toLowerCase() === "employee" && availableAdmins.length === 1)) ? (
                        <div className="h-10 w-full rounded-lg border border-primary/10 bg-primary/5 px-3 flex items-center text-sm text-black/60 italic transition-all">
                          {(() => {
                            const admin = (activeSystemUser.role || "").toLowerCase() === "admin" ? activeSystemUser : availableAdmins[0]
                            return `${admin.name} • ${admin.appName || "Standard"} • ${admin.id}`
                          })()}
                        </div>
                      ) : (
                        <select 
                            className={`h-10 w-full rounded-lg border px-3 text-sm text-black transition-all ${
                              activeSystemUser && availableAdmins.length === 0 
                                ? "border-red-500 focus:ring-2 focus:ring-red-100 bg-red-50/10 cursor-not-allowed" 
                                : "border-border/50 bg-background/50 focus:ring-2 focus:ring-primary/20 hover:border-primary/30 cursor-pointer"
                            }`}
                            value={selectedSystemAdminId}
                            onChange={(e) => setSelectedSystemAdminId(e.target.value)}
                            disabled={selectedPageIds.length === 0 && (activeSystemUser?.role || "").toLowerCase() !== "employee"}
                        >
                            <option value="">{activeSystemUser && availableAdmins.length === 0 ? "No admin available for management" : "Select target admin..."}</option>
                            {( (activeSystemUser?.role || "").toLowerCase() === "employee" ? availableAdmins : systemUsers.filter(u => (u.status || "Active") === "Active" && (u.role || "").toLowerCase() === "admin")).map(u => (
                                <option key={u.id} value={u.id}>{u.name} • {u.appName || "Standard"} • {u.id}</option>
                            ))}
                        </select>
                      )}
                      
                      {activeSystemUser && availableAdmins.length === 0 && (
                        <p className="text-[10px] text-red-500 font-medium ml-1">
                          No admin available for management
                        </p>
                      )}
                    </div>
                    {/* Add a spacer to match row 1 tail buttons */}
                    <div className="w-[200px] shrink-0 hidden md:block" />
                </div>
                
                <p className="text-[10px] text-black/60 italic ml-1">
                   <span className="text-black">Note:</span> Delete works only when the selected system user and system admin are in the same app.
                </p>

                {/* Bulk Actions Header */}
                <div className="flex items-center justify-between pt-4 pb-2 border-t border-border/20">
                    <div className="flex items-center gap-4">
                        <h3 className="text-lg tracking-tighter text-black">All Pages</h3>
                        <div className="flex items-center gap-3 text-[10px] text-black/40 tracking-wider">
                           <span>pages: {standalonePages.length}</span>
                           <span>selected: {selectedPageIds.length}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-10 px-4 border-border/50 bg-background/50 text-xs text-black hover:bg-primary/5 cursor-pointer gap-2"
                            onClick={() => {
                                navigator.clipboard.writeText(selectedPageIds.join("\n"))
                                toast.success("Page IDs copied to clipboard")
                            }}
                            disabled={selectedPageIds.length === 0}
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Copy Selected
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-10 px-4 border-red-500/20 bg-red-500/5 text-xs font-bold text-red-600 hover:bg-red-500/10 cursor-pointer gap-2"
                            onClick={async () => {
                                if (!selectedSystemAdminId) {
                                    toast.error("Please select a System Admin first")
                                    return
                                }
                                if (confirm(`Remove permissions for ${selectedPageIds.length} pages from this user?`)) {
                                    try {
                                        setLoading(true)
                                        const admin = systemUsers.find(u => u.id === selectedSystemAdminId)
                                        if (!admin?.token) throw new Error("Admin token not found")
                                        
                                        const result = await facebookService.removeSystemUserFromPagesByPageAssignedUsersBatch(
                                            selectedPageIds,
                                            activeViewerId,
                                            admin.token
                                        )
                                        
                                        if (result.successPageIds.length > 0) {
                                            toast.success(`Removed ${result.successPageIds.length} permissions`)
                                            // Re-fetch assets
                                            const user = systemUsers.find(u => u.id === activeViewerId)
                                            if (user) await handleFetchAssets(user.token || "", user.id)
                                        }
                                        if (result.failed.length > 0) {
                                            toast.error(`Failed to remove ${result.failed.length} permissions`)
                                        }
                                    } catch (err) {
                                        toast.error(err instanceof Error ? err.message : "Delete failed")
                                    } finally {
                                        setLoading(false)
                                    }
                                }
                            }}
                            disabled={selectedPageIds.length === 0 || !selectedSystemAdminId}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete Selected
                        </Button>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-10 px-4 border-red-500/20 bg-red-500/5 text-xs font-bold text-red-600 hover:bg-red-500/10 cursor-pointer gap-2"
                            onClick={() => setSelectedPageIds([])}
                            disabled={selectedPageIds.length === 0}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear Selected
                        </Button>
                    </div>
                </div>

                {/* Table redesigned specifically for System User Page Management */}
                <div className="rounded-2xl border border-border/40 bg-background/30 overflow-hidden shadow-inner">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50 h-14">
                                <TableHead className="w-16 text-sm font-bold text-black text-center px-6">#</TableHead>
                                <TableHead className="text-sm font-bold text-black px-6">Page ID</TableHead>
                                <TableHead className="text-sm font-bold text-black px-6">Page Name</TableHead>
                                <TableHead className="text-sm font-bold text-black px-6">Category</TableHead>
                                <TableHead className="text-sm font-bold text-black px-6 text-center">Actions</TableHead>
                                <TableHead className="w-16 px-6 text-right">
                                    <Checkbox 
                                        checked={standalonePages.length > 0 && selectedPageIds.length === standalonePages.length}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedPageIds(standalonePages.map(p => p.id))
                                            else setSelectedPageIds([])
                                        }}
                                        className="h-5 w-5 rounded-md border-border/60"
                                    />
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-24 text-center">
                                        <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary/20" />
                                        <p className="mt-4 text-[10px] font-bold tracking-widest text-black/20">Establishing identity link...</p>
                                    </TableCell>
                                </TableRow>
                            ) : standalonePages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-32 text-center">
                                        <EmptyState mode="System User" />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                standalonePages.map((page, index) => (
                                    <TableRow 
                                        key={page.id} 
                                        className={`group border-border/20 transition-all duration-300 cursor-pointer h-14 ${selectedPageIds.includes(page.id) ? "bg-primary/[0.03]" : "hover:bg-muted/40"}`}
                                        onClick={() => {
                                            const isChecked = selectedPageIds.includes(page.id)
                                            setSelectedPageIds(prev => isChecked ? prev.filter(id => id !== page.id) : [...prev, page.id])
                                        }}
                                    >
                                        <TableCell className="text-center text-black/40 text-[10px] tabular-nums">{index + 1}</TableCell>
                                        <TableCell className="px-6 font-mono text-sm text-black/80">{page.id}</TableCell>
                                        <TableCell className="px-6 text-sm text-black tracking-tight">{page.name}</TableCell>
                                        <TableCell className="px-6 font-medium text-black/60 text-sm">{page.category || "—"}</TableCell>
                                        <TableCell className="px-6 text-center" onClick={e => e.stopPropagation()}>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-all text-primary"
                                                onClick={() => {
                                                    setEditingPage(page)
                                                    setIsEditModalOpen(true)
                                                }}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                                            <Checkbox 
                                                checked={selectedPageIds.includes(page.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedPageIds(prev => checked ? [...prev, page.id] : prev.filter(id => id !== page.id))
                                                }}
                                                className="h-5 w-5 rounded-md border-border/60"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Footer notes */}
                <div className="space-y-1.5 px-1 py-4">
                   <p className="text-[10px] text-black/40 tracking-tight leading-relaxed">
                      * Note: • Copy Selected copies page IDs line by line (one page ID per line).
                   </p>
                   <p className="text-[10px] text-black/40 tracking-tight leading-relaxed">
                      • Delete Selected removes selected page permissions from this system user.
                   </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                 <div className="flex flex-wrap items-center gap-4 mb-8">
                  <div className="flex flex-col gap-1.5 flex-1 min-w-[280px]">
                     <label className="text-sm font-bold tracking-tight text-black ml-1">
                       Account Access Token
                     </label>
                     <input
                       type="text"
                       placeholder="Paste access token here (EAAB...)"
                       className="h-11 rounded-xl border border-border/50 bg-background/50 px-4 text-sm font-mono text-black focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all"
                       value={manualToken}
                       onChange={(e) => setManualToken(e.target.value)}
                     />
                  </div>
                    
                    <div className="flex items-end h-11 pb-1">
                       {loading && (
                         <div className="flex items-center gap-2 text-primary animate-pulse">
                           <Loader2 className="w-4 h-4 animate-spin" />
                           <span className="text-sm font-bold tracking-tight">Protocol sync in progress...</span>
                         </div>
                       )}
                    </div>

                     <div className="ml-auto flex items-end">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`h-11 px-6 border-border/50 bg-background/50 text-sm tracking-tight cursor-pointer ${loading ? "border-green-600/50 bg-green-50 text-green-600" : ""}`}
                          onClick={handleManualSync}
                          disabled={!manualToken || loading}
                        >
                          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? "animate-spin text-green-600" : ""}`} /> 
                          Crawl & Process
                        </Button>
                     </div>
                 </div>

                 {/* Asset Display Area */}
                 <div className="space-y-4 min-h-[400px]">
                   {businessRows.length > 0 ? (
                      businessRows.map(row => (
                        <BusinessAssetCard 
                          key={row.id}
                          business={row}
                          selectedPageIds={selectedPageIds}
                          onSelectionChange={setSelectedPageIds}
                        />
                      ))
                    ) : !loading && (
                      <EmptyState mode="Account User" />
                    )}
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Hub - Only for Account User Mode */}
      {mode === "account-user" && (
        <div className="w-full h-fit">
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
      )}

      {/* Page Edit Modal */}
      <PageEditModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingPage(null)
        }}
        page={editingPage}
        onSuccess={() => {
          if (activeViewerToken && activeViewerId) {
            void handleFetchAssets(activeViewerToken, activeViewerId)
          }
        }}
        adminToken={selectedSystemAdminId && systemUsers.find(u => u.id === selectedSystemAdminId)?.token || activeViewerToken}
      />
    </div>
  )
}

function EmptyState({ mode }: { mode: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-8">
      <div className="p-5 bg-muted rounded-full mb-6 opacity-20">
        <Layers className="w-16 h-16" />
      </div>
      <div className="max-w-xs space-y-2">
        <h3 className="text-sm tracking-widest text-black">No pages found for this {mode === "System User" ? "system user" : "account"}</h3>
        <p className="text-[10px] tracking-tight leading-relaxed text-black/40">
           {mode === "System User" ? "Select a validated identity node to discover assets linked via System User protocol." : "Establish an identity link to begin crawler protocol."}
        </p>
      </div>
    </div>
  )
}

"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Copy, Search, CheckCircle2, AlertCircle, Pencil, Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BusinessDetailSheet } from "./BusinessDetailSheet"
import { BusinessRow, SystemUser, FacebookPage } from "@/types/facebook"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { facebookService } from "@/services/facebook.service"


interface AccountUserModeProps {
  loading: boolean
  manualToken: string
  setManualToken: (val: string) => void
  handleManualSync: () => Promise<void>
  businessRows: BusinessRow[]
  isDetailSheetOpen: boolean
  setIsDetailSheetOpen: (val: boolean) => void
  selectedBusiness: BusinessRow | null
  openBusinessDetail: (business: BusinessRow) => void
  activeAccountUserToken: string
  setEditingPage: (page: FacebookPage | null) => void
  setIsEditModalOpen: (open: boolean) => void
  systemUsers: SystemUser[]
  currentUser: SystemUser | null
  lastSyncTime: string
  handleRecrawlBusiness: (id: string) => Promise<void>
  recrawlingIds: Set<string>
}

export function AccountUserMode({
  loading,
  manualToken,
  setManualToken,
  handleManualSync,
  businessRows,
  standalonePages = [],
  isDetailSheetOpen,
  setIsDetailSheetOpen,
  selectedBusiness,
  openBusinessDetail,
  activeAccountUserToken,
  setEditingPage,
  setIsEditModalOpen,
  systemUsers,
  currentUser,
  lastSyncTime,
  handleRecrawlBusiness,
  recrawlingIds
}: AccountUserModeProps & { standalonePages?: FacebookPage[] }) {
  const [selectedBusinessIds] = useState<string[]>([])
  const [selectedStandalonePageIds, setSelectedStandalonePageIds] = useState<string[]>([])
  const [isAddingToBm, setIsAddingToBm] = useState(false)

  const handleAddToBm = async (businessId: string) => {
    if (selectedStandalonePageIds.length === 0) {
      toast.error("Resource error: No assets selected for execution")
      return
    }

    try {
      setIsAddingToBm(true)
      const result = await facebookService.addPagesToBusinessOwnedPagesBatch(
        selectedStandalonePageIds,
        businessId,
        activeAccountUserToken
      )

      if (result.successPageIds.length > 0) {
        toast.success(`Successfully added ${result.successPageIds.length} pages to BM`)
        setSelectedStandalonePageIds([])
        await handleManualSync()
      }

      if (result.failed.length > 0) {
        toast.error(`Failed to add ${result.failed.length} pages: ${result.failed[0].message}`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Critical execution error")
    } finally {
      setIsAddingToBm(false)
    }
  }

  const handleCopyAccessToken = (token: string | undefined) => {
    if (token) {
      navigator.clipboard.writeText(token)
      toast.success("Access Token copied to clipboard")
    }
  }

  const getPageRole = (tasks?: string[]) => {
    if (!tasks) return "Unknown"
    const allTasks = ["MODERATE", "MESSAGING", "ANALYZE", "ADVERTISE", "CREATE_CONTENT", "MANAGE"]
    const hasAll = allTasks.every(t => tasks.includes(t))

    if (hasAll) return "Owner"
    if (tasks.includes("MANAGE")) return "Admin"
    if (tasks.includes("CREATE_CONTENT")) return "Editor"
    if (tasks.includes("MODERATE")) return "Moderator"
    if (tasks.includes("MESSAGING")) return "Agent"
    if (tasks.includes("ADVERTISE")) return "Advertiser"
    if (tasks.includes("ANALYZE")) return "Analyst"
    return "User"
  }

  const getRoleStyles = (role: string) => {
    switch (role) {
      case "Owner":
        return "border-indigo-400/30 text-indigo-600 bg-indigo-50/50"
      case "Admin":
        return "border-blue-400/30 text-blue-600 bg-blue-50/50"
      case "Editor":
        return "border-emerald-400/30 text-emerald-600 bg-emerald-50/50"
      case "Moderator":
        return "border-orange-400/30 text-orange-600 bg-orange-50/50"
      case "Agent":
        return "border-teal-400/30 text-teal-600 bg-teal-50/50"
      case "Advertiser":
        return "border-rose-400/30 text-rose-600 bg-rose-50/50"
      case "Analyst":
        return "border-amber-400/30 text-amber-600 bg-amber-50/50"
      default:
        return "border-slate-400/30 text-slate-600 bg-slate-50/50"
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Token Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <input
            type="text"
            placeholder="EAASyCcEMf0sBRA1ahCTtzRh9CgNVFSxp4TeFl... (Access Token)"
            className="w-full h-11 px-4 py-2 rounded-xl border border-border/60 bg-background/50 text-sm font-mono focus:ring-2 focus:ring-primary/20 hover:border-primary/40 transition-all outline-none pr-12"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
          />
          <div className="absolute right-1 top-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={() => handleCopyAccessToken(manualToken)}
              disabled={!manualToken}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-11 px-6 gap-2 font-normal shadow-sm hover:shadow-md transition-all border border-green-600 text-green-600 rounded-xl bg-transparent hover:bg-green-50/50 hover:text-green-600 cursor-pointer"
          onClick={handleManualSync}
          disabled={loading || !manualToken}
        >
          <RefreshCcw className={`h-4 w-4 text-green-600 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Business Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-normal tracking-tighter text-black">Businesses</h2>
          <div className="text-[10px] text-black/40 tracking-wider">
            items: {businessRows.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-background/30 overflow-hidden shadow-inner">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50 h-11">
                <TableHead className="w-16 text-sm font-bold text-black text-center px-6">#</TableHead>
                <TableHead className="text-sm font-bold text-black px-6">Business ID</TableHead>
                <TableHead className="text-sm font-bold text-black px-6">Business Name</TableHead>
                <TableHead className="text-sm font-bold text-black px-6 text-center">Status</TableHead>
                <TableHead className="text-sm font-bold text-black px-6 text-center">Role</TableHead>
                <TableHead className="text-sm font-bold text-black px-6 text-center">Assigned Pages</TableHead>
                <TableHead className="text-sm font-bold text-black px-6 text-center">Total Pages</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-20 text-center border-none">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-green-600/20" />
                      <p className="mt-4 text-[10px] font-normal tracking-widest text-black/20 capitalize">Refreshing assets...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : businessRows.length > 0 ? (
                businessRows.map((bm, index) => (
                  <TableRow
                    key={bm.id}
                    className={`group border-border/20 transition-all duration-300 cursor-pointer h-14 ${selectedBusinessIds.includes(bm.id) ? "bg-primary/[0.03]" : "hover:bg-muted/40"}`}
                    onClick={() => openBusinessDetail(bm)}
                  >
                    <TableCell className="text-center text-black font-normal text-sm w-16 px-6">{index + 1}</TableCell>
                    <TableCell className="px-6 font-mono text-sm text-black/80">
                      <div className="flex items-center justify-start group/id">
                        <span className="truncate w-[135px]">{bm.id}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 border-border/30 bg-background/50 hover:bg-muted transition-all cursor-pointer rounded-md shrink-0 ml-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(bm.id)
                            toast.success("Business ID copied")
                          }}
                        >
                          <Copy className="w-2.5 h-2.5 text-black/40" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-sm text-black tracking-tight font-normal">{bm.name}</TableCell>
                    <TableCell className="px-6 text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="inline-flex items-center justify-center gap-1.5 cursor-help">
                              {bm.is_promotable === false ? (
                                <>
                                  <AlertCircle className="w-4 h-4 text-red-600" />
                                  <span className="text-sm font-medium text-red-600">Restricted</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  <span className="text-sm font-medium text-green-600">Active</span>
                                </>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px] p-3 rounded-xl border-border/40 shadow-xl bg-background/95 backdrop-blur-md space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-black/60">Business Health Status</p>
                            <div className="space-y-1.5 pt-1">
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-black/40">Is Promotable</span>
                                <span className={`text-[10px] font-medium ${bm.is_promotable !== false ? "text-green-600" : "text-red-600"}`}>
                                  {bm.is_promotable !== false ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-black/40">Can Create Ad Accounts</span>
                                <span className={`text-[10px] font-medium ${bm.can_create_ad_accounts !== false ? "text-green-600" : "text-orange-600"}`}>
                                  {bm.can_create_ad_accounts !== false ? "Yes" : "No"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-[10px] text-black/40">Sharing Eligibility</span>
                                <span className={`text-[10px] font-medium ${bm.sharing_eligibility_status === "eligible" ? "text-green-600" : "text-orange-600"}`}>
                                  {bm.sharing_eligibility_status || "Unknown"}
                                </span>
                              </div>
                              <div className="border-t border-border/40 my-1 pt-1.5">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-[10px] text-black/40">Verification</span>
                                  <span className="text-[10px] font-medium capitalize text-black">{bm.verification_status || "unverified"}</span>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="px-6 text-center">
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {bm.permitted_roles && bm.permitted_roles.length > 0 ? (
                          <span className="text-sm text-black capitalize">
                            {bm.permitted_roles.map(role => role.toLowerCase()).join(", ")}
                          </span>
                        ) : (
                          <span className="text-sm text-black/20">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-center">
                      <span className="text-sm text-black font-medium tabular-nums">
                        {bm.assignedPageIds?.length || 0}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 text-center">
                      <span className="text-sm text-black font-medium tabular-nums">
                        {bm.pages?.length || 0}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-20 text-center border-none">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Search className="h-6 w-6 opacity-20" />
                      <span className="text-xs italic tracking-widest font-normal text-black/20 capitalize">No businesses found</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pages Outside Business Table */}
      <div className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-normal tracking-tighter text-black">Pages Outside Business</h2>
          <div className="flex items-center gap-4 text-[10px] text-black/40 tracking-wider">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs text-black/60 hover:text-black hover:bg-black/5 gap-1.5 transition-all duration-200 rounded-lg border border-border/40 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                onClick={() => {
                  const ids = selectedStandalonePageIds.join("\n")
                  navigator.clipboard.writeText(ids)
                  toast.success(`Copied ${selectedStandalonePageIds.length} page IDs`)
                }}
                disabled={selectedStandalonePageIds.length === 0}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Selected ({selectedStandalonePageIds.length})</span>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50/50 gap-1.5 transition-all duration-200 rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={isAddingToBm || selectedStandalonePageIds.length === 0}
                  >
                    {isAddingToBm ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Add ({selectedStandalonePageIds.length}) into Business</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px] max-h-[350px] overflow-y-auto p-1 rounded-xl shadow-xl backdrop-blur-md bg-white/95 border-border/40">
                  <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-black/40 border-b border-border/20 mb-1">
                    Select Target Business
                  </div>
                  {businessRows.filter(bm => bm.permitted_roles?.includes("ADMIN")).length > 0 ? (
                    businessRows
                      .filter(bm => bm.permitted_roles?.includes("ADMIN"))
                      .map((bm) => (
                        <DropdownMenuItem
                          key={bm.id}
                          onClick={() => handleAddToBm(bm.id)}
                          className="flex flex-col items-start gap-1 p-2 cursor-pointer focus:bg-muted/60 rounded-lg"
                        >
                          <span className="text-xs font-medium text-black truncate w-full">{bm.name}</span>
                          <span className="text-[9px] font-mono text-black/40">{bm.id}</span>
                        </DropdownMenuItem>
                      ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground italic">
                      No admin businesses found
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <span>items: {standalonePages.length}</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-background/30 overflow-hidden shadow-inner w-full">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50 h-11">
                <TableHead className="w-16 text-sm font-bold text-black text-center px-6">#</TableHead>
                <TableHead className="w-[200px] text-sm font-bold text-black px-6">Page ID</TableHead>
                <TableHead className="text-sm font-bold text-black px-6">Page Name</TableHead>
                <TableHead className="w-[200px] text-sm font-bold text-black px-6 text-center">Category</TableHead>
                <TableHead className="w-[200px] text-sm font-bold text-black px-6 text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        Role
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[260px] p-3 shadow-xl bg-background/95 backdrop-blur-md border-border/40">
                        <div className="space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 border-b border-border/40 pb-1">Permission Levels</p>
                          <div className="grid gap-1.5">
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-black w-14 shrink-0">Owner</span>
                              <span className="text-[10px] text-black/60 leading-tight">Full access to all 6 core page tasks.</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-black w-14 shrink-0">Admin</span>
                              <span className="text-[10px] text-black/60 leading-tight">Can manage page settings and permissions.</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-black w-14 shrink-0">Editor</span>
                              <span className="text-[10px] text-black/60 leading-tight">Can publish content and send messages.</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-black w-14 shrink-0">Moderator</span>
                              <span className="text-[10px] text-black/60 leading-tight">Can respond to comments and moderate.</span>
                            </div>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="w-[200px] text-sm font-bold text-black px-6 text-center">Actions</TableHead>
                <TableHead className="w-16 px-6 text-right">
                  <Checkbox
                    checked={standalonePages.length > 0 && selectedStandalonePageIds.length === standalonePages.length}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedStandalonePageIds(standalonePages.map(p => p.id))
                      else setSelectedStandalonePageIds([])
                    }}
                    className="h-5 w-5 rounded-md border-border/60"
                  />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-20 text-center border-none">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-green-600/20" />
                      <p className="mt-4 text-[10px] font-normal tracking-widest text-black/20 capitalize">Discovering pages...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : standalonePages.length > 0 ? (
                standalonePages.map((page, index) => (
                  <TableRow
                    key={page.id}
                    className={`group border-border/20 transition-all duration-300 h-14 cursor-pointer ${selectedStandalonePageIds.includes(page.id) ? "bg-primary/[0.03]" : "hover:bg-muted/40"}`}
                    onClick={() => {
                      const isChecked = selectedStandalonePageIds.includes(page.id)
                      setSelectedStandalonePageIds(prev => isChecked ? prev.filter(id => id !== page.id) : [...prev, page.id])
                    }}
                  >
                    <TableCell className="text-center text-black font-normal text-sm w-16 px-6">{index + 1}</TableCell>
                    <TableCell className="w-[200px] px-6 font-mono text-sm text-black/80">
                      <div className="flex items-center justify-start group/id">
                        <span className="truncate w-[135px]">{page.id}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6 border-border/30 bg-background/50 hover:bg-muted transition-all cursor-pointer rounded-md shrink-0 ml-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(page.id)
                            toast.success("Page ID copied")
                          }}
                        >
                          <Copy className="w-2.5 h-2.5 text-black/40" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-sm text-black tracking-tight font-normal">{page.name}</TableCell>
                    <TableCell className="w-[200px] px-6 text-center">
                      <span className="text-sm text-black capitalize">
                        {(page.category || "").toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="w-[200px] px-6 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[9.5px] font-bold border rounded-md whitespace-nowrap ${getRoleStyles(getPageRole(page.tasks))}`}
                      >
                        {getPageRole(page.tasks)}
                      </Badge>
                    </TableCell>
                    <TableCell className="w-[200px] px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-border/30 bg-background/50 hover:bg-muted transition-all cursor-pointer rounded-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (page.access_token) {
                              navigator.clipboard.writeText(page.access_token)
                              toast.success("Page access token copied")
                            } else {
                              toast.error("No access token found for this page")
                            }
                          }}
                          title="Copy Access Token"
                        >
                          <Copy className="w-3.5 h-3.5 text-black/40" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 border-border/30 bg-background/50 hover:bg-muted transition-all cursor-pointer rounded-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingPage(page)
                            setIsEditModalOpen(true)
                          }}
                          title="Edit Page"
                        >
                          <Pencil className="w-3.5 h-3.5 text-black/40" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="w-16 px-6 text-right" onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedStandalonePageIds.includes(page.id)}
                        onCheckedChange={(checked) => {
                          setSelectedStandalonePageIds(prev => checked ? [...prev, page.id] : prev.filter(id => id !== page.id))
                        }}
                        className="h-5 w-5 rounded-md border-border/60"
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Search className="h-6 w-6 opacity-20" />
                      <span className="text-xs italic tracking-widest font-normal text-black/20 capitalize">No pages outside business</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <BusinessDetailSheet
        business={selectedBusiness}
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
        systemUsers={systemUsers}
        currentUser={currentUser}
        lastSync={lastSyncTime}
        isRecrawling={recrawlingIds.has(selectedBusiness?.id || "")}
        onRecrawl={() => selectedBusiness && handleRecrawlBusiness(selectedBusiness.id)}
        adminToken={activeAccountUserToken}
      />
    </div>
  )
}

import React from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Copy, RefreshCcw, Trash2, Pencil } from "lucide-react"
import { SystemUser, FacebookPage } from "@/types/facebook"
import { EmptyState } from "./EmptyState"
import { LoadingScreen } from "@/components/ui/loading-screen"

interface SystemUserModeProps {
  loading: boolean
  systemUsers: SystemUser[]
  systemUserPages: FacebookPage[]
  selectedBmFilter: string
  setSelectedBmFilter: (val: string) => void
  activeViewerId: string
  activeViewerToken: string
  selectedSystemAdminId: string
  setSelectedSystemAdminId: (val: string) => void
  selectedPageIds: string[]
  setSelectedPageIds: (ids: string[] | ((prev: string[]) => string[])) => void
  handleFetchAssets: (token: string, userId: string) => Promise<void>
  handleCopyUserToken: () => void
  loadSystemUsers: (pw: string) => Promise<void>
  adminPassword: string
  availableAdmins: SystemUser[]
  filteredSystemUsers: SystemUser[]
  bmFilterOptions: { id: string, name: string }[]
  activeSystemUser: SystemUser | undefined
  setEditingPage: (page: FacebookPage | null) => void
  setIsEditModalOpen: (open: boolean) => void
  handleDeleteSelected: () => Promise<void>
  handleCopySelected: () => void
}

export function SystemUserMode({
  loading, systemUsers, systemUserPages, selectedBmFilter, setSelectedBmFilter,
  activeViewerId, activeViewerToken, selectedSystemAdminId, setSelectedSystemAdminId,
  selectedPageIds, setSelectedPageIds, handleFetchAssets, handleCopyUserToken,
  loadSystemUsers, adminPassword, availableAdmins, filteredSystemUsers,
  bmFilterOptions, activeSystemUser, setEditingPage, setIsEditModalOpen,
  handleDeleteSelected, handleCopySelected
}: SystemUserModeProps) {
  return (
    <div className="space-y-6">
      {/* System User Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <select 
          className="h-10 w-[160px] rounded-lg border border-border/50 bg-background/50 px-3 text-sm text-black focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all cursor-pointer shrink-0"
          value={selectedBmFilter}
          onChange={(e) => {
            setSelectedBmFilter(e.target.value)
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
                  <span>pages: {systemUserPages.length}</span>
                  <span>selected: {selectedPageIds.length}</span>
              </div>
          </div>

          <div className="flex items-center gap-2">
              <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-4 border-border/50 bg-background/50 text-xs text-black hover:bg-primary/5 cursor-pointer gap-2"
                  onClick={handleCopySelected}
                  disabled={selectedPageIds.length === 0}
              >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Selected
              </Button>
              <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-4 border-red-500/20 bg-red-500/5 text-xs font-bold text-red-600 hover:bg-red-500/10 cursor-pointer gap-2"
                  onClick={handleDeleteSelected}
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
                  <TableRow className="hover:bg-transparent border-border/50 h-11">
                      <TableHead className="w-16 text-sm font-bold text-black text-center px-6">#</TableHead>
                      <TableHead className="text-sm font-bold text-black px-6">Page ID</TableHead>
                      <TableHead className="text-sm font-bold text-black px-6">Page Name</TableHead>
                      <TableHead className="text-sm font-bold text-black px-6">Category</TableHead>
                      <TableHead className="text-sm font-bold text-black px-6 text-center">Actions</TableHead>
                      <TableHead className="w-16 px-6 text-right">
                          <Checkbox 
                              checked={systemUserPages.length > 0 && selectedPageIds.length === systemUserPages.length}
                              onCheckedChange={(checked) => {
                                  if (checked) setSelectedPageIds(systemUserPages.map(p => p.id))
                                  else setSelectedPageIds([])
                              }}
                              className="h-5 w-5 rounded-md border-border/60"
                          />
                      </TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {loading ? (
                      <TableRow className="hover:bg-transparent border-none">
                          <TableCell colSpan={6} className="py-0 text-center border-none">
                            <LoadingScreen fullScreen={false} />
                          </TableCell>
                      </TableRow>
                  ) : systemUserPages.length === 0 ? (
                      <TableRow className="hover:bg-transparent">
                          <TableCell colSpan={6} className="py-20 text-center border-none">
                              <EmptyState mode="System User" />
                          </TableCell>
                      </TableRow>
                  ) : (
                      systemUserPages.map((page, index) => (
                          <TableRow 
                              key={page.id} 
                              className={`group border-border/20 transition-all duration-300 cursor-pointer h-14 ${selectedPageIds.includes(page.id) ? "bg-primary/[0.03]" : "hover:bg-muted/40"}`}
                              onClick={() => {
                                  const isChecked = selectedPageIds.includes(page.id)
                                  setSelectedPageIds(prev => isChecked ? prev.filter(id => id !== page.id) : [...prev, page.id])
                              }}
                          >
                              <TableCell className="text-center text-black font-normal text-sm w-16 px-6">{index + 1}</TableCell>
                              <TableCell className="px-6 font-mono text-sm text-black/80">{page.id}</TableCell>
                              <TableCell className="px-6 text-sm text-black tracking-tight font-normal">{page.name}</TableCell>
                              <TableCell className="px-6 font-normal text-black/60 text-sm capitalize">{(page.category || "").toLowerCase()}</TableCell>
                              <TableCell className="px-6 text-center" onClick={e => e.stopPropagation()}>
                                  <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 rounded-lg hover:bg-primary/10 transition-all text-primary cursor-pointer"
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
  )
}

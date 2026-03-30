"use client"

import React, { useState } from "react"
import { Flag, Zap, Users2, ShieldCheck, ChevronRight, ChevronDown, Package, Loader2, LogOut, AlertCircle, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog"
import { BusinessRow, FacebookPage, SystemUser } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"
import { AddPageDialog } from "./AddPageDialog"
import { AssignUserDialog } from "./AssignUserDialog"
import { AddToGroupDialog } from "./AddToGroupDialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PagesTabProps {
  business: BusinessRow
  adminToken: string
  onRecrawl?: () => void
  standalonePages?: FacebookPage[]
  systemUsers?: SystemUser[]
  allBusinessUsers?: { id: string; name: string; email?: string; role?: string }[]
}

export const PagesTab = ({ 
  business, 
  adminToken, 
  onRecrawl, 
  standalonePages = [],
  systemUsers = [],
  allBusinessUsers = []
}: PagesTabProps) => {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [assignedUsers, setAssignedUsers] = useState<{ id: string; name: string; tasks: string[]; user_type: string }[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  
  // Revoke state
  const [userToRevoke, setUserToRevoke] = useState<{ id: string; name: string } | null>(null)
  const [isRevoking, setIsRevoking] = useState(false)
  
  // Remove Page state
  const [showRemovePageConfirm, setShowRemovePageConfirm] = useState(false)
  const [isRemovingPage, setIsRemovingPage] = useState(false)

  // Remove from Group state
  const [groupToRemoveFrom, setGroupToRemoveFrom] = useState<{ id: string; name: string } | null>(null)
  const [isRemovingFromGroup, setIsRemovingFromGroup] = useState(false)

  const selectedPage = business.pages?.find(p => p.id === selectedPageId)
  const isReadOnly = selectedPage?.source === "asset_group"

  const groupsContainingPage = React.useMemo(() => {
    if (!selectedPageId || !business.business_asset_groups?.data) return []
    return business.business_asset_groups.data.filter(group => 
      group.contained_pages?.data?.some(p => p.id === selectedPageId)
    )
  }, [selectedPageId, business.business_asset_groups?.data])

  const fetchAssignedUsers = React.useCallback(async (pageId: string) => {
    setIsLoadingUsers(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/pages/${pageId}/users?token=${adminToken}`)
      const data = await res.json()
      if (data.success) {
        setAssignedUsers(data.data || [])
      } else {
        setAssignedUsers([])
      }
    } catch (err) {
      console.error("[PagesTab] Failed to fetch users:", err)
      setAssignedUsers([])
    } finally {
      setIsLoadingUsers(false)
    }
  }, [business.id, adminToken])

  React.useEffect(() => {
    if (selectedPageId) {
      fetchAssignedUsers(selectedPageId)
    } else {
      setAssignedUsers([])
      setExpandedUserId(null)
    }
  }, [selectedPageId, fetchAssignedUsers])

  const handleUnassignUser = (userId: string, userName: string) => {
    setUserToRevoke({ id: userId, name: userName })
  }

  const confirmRevokeAccess = async () => {
    if (!selectedPageId || !userToRevoke) return
    setIsRevoking(true)

    try {
      const res = await fetch(`/api/facebook/business/${business.id}/pages/${selectedPageId}/users?token=${adminToken}&userId=${userToRevoke.id}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to unassign user")
      
      toast.success(`Revoked access for ${userToRevoke.name}`)
      setUserToRevoke(null)
      fetchAssignedUsers(selectedPageId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unassign")
    } finally {
      setIsRevoking(false)
    }
  }

  const handleRemovePage = async () => {
    if (!selectedPageId || !selectedPage) return
    setIsRemovingPage(true)

    try {
      const res = await fetch(`/api/facebook/business/${business.id}/pages?token=${adminToken}&page_id=${selectedPageId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      
      if (!res.ok || data.error) throw new Error(data.error || "Failed to remove page")

      toast.success(`Broadly removed ${selectedPage.name} from Business`)
      setShowRemovePageConfirm(false)
      setSelectedPageId(null)
      if (onRecrawl) onRecrawl()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove page")
    } finally {
      setIsRemovingPage(false)
    }
  }

  const confirmRemoveFromGroup = async () => {
    if (!selectedPageId || !groupToRemoveFrom) return
    setIsRemovingFromGroup(true)

    try {
      const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${groupToRemoveFrom.id}?token=${encodeURIComponent(adminToken)}&action=remove_asset&assetId=${selectedPageId}&type=PAGE`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to remove from group")
      
      toast.success(`Removed from ${groupToRemoveFrom.name}`)
      setGroupToRemoveFrom(null)
      if (onRecrawl) onRecrawl()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove from group")
    } finally {
      setIsRemovingFromGroup(false)
    }
  }

  const ownedPages = business.pages?.filter(p => !p.source || p.source === "owned") || []
  const clientPages = business.pages?.filter(p => p.source === "client") || []
  const assetGroupPages = business.pages?.filter(p => p.source === "asset_group") || []

  const formatTask = (task: string) => {
    return task.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }

  return (
    <DetailContainer
      isOpen={!!selectedPageId}
      onClose={() => setSelectedPageId(null)}
      detailContent={
        selectedPage ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <Flag className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium tracking-tight">{selectedPage.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-normal h-5 border-blue-200 bg-blue-50 text-blue-600 capitalize">
                      {selectedPage.source === "asset_group" ? "Asset Group Page" : "Business Page"}
                    </Badge>
                    {selectedPage.source && (
                      <Badge variant="secondary" className="text-[10px] font-normal h-5 capitalize">
                        Source: {selectedPage.source}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side Actions */}
              <div className="flex items-center gap-4 pr-12">
                {!isReadOnly && (
                  <button 
                    onClick={() => setShowRemovePageConfirm(true)}
                    className="flex items-center justify-center w-7 h-7 rounded-lg border border-destructive text-destructive hover:bg-destructive hover:text-white transition-all cursor-pointer group"
                    title="Remove Page from Business Manager"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {isReadOnly ? (
              <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Read-Only Asset</span>
                </div>
                <p className="text-xs text-amber-600 leading-relaxed">
                  This page is shared with you via an <strong>Asset Group</strong>. Administrative actions such as role management or token generation must be performed by the Business Manager that owns this asset group.
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Management Tasks
                  </h4>
                  <div className="grid gap-2">
                    <AssignUserDialog 
                      business={business}
                      pageId={selectedPage.id}
                      pageName={selectedPage.name || "This Page"}
                      adminToken={adminToken}
                      systemUsers={systemUsers}
                      allBusinessUsers={allBusinessUsers}
                      onSuccess={() => fetchAssignedUsers(selectedPage.id)}
                      existingUserIds={assignedUsers.map(u => u.id)}
                      trigger={
                        <button className="p-3 w-full text-left rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/5">
                              <Users2 className="w-4 h-4 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium">Assign Permissions</p>
                              <p className="text-[10px] text-muted-foreground">Assign people to manage this page and its tools</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                        </button>
                      }
                    />

                    <AddToGroupDialog 
                      business={business}
                      pageId={selectedPage.id}
                      pageName={selectedPage.name || "This Page"}
                      adminToken={adminToken}
                      onSuccess={() => {
                          if (onRecrawl) onRecrawl()
                      }}
                      trigger={
                        <button className="p-3 w-full text-left rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/5">
                              <Package className="w-4 h-4 text-primary" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium">Add to Group</p>
                              <p className="text-[10px] text-muted-foreground">Include this page in a business asset group</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                        </button>
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <Users2 className="w-3 h-3" />
                      People {assignedUsers.length > 0 ? `(${assignedUsers.length})` : ""}
                    </div>
                    {!isReadOnly && (
                        <AssignUserDialog 
                          business={business}
                          pageId={selectedPage.id}
                          pageName={selectedPage.name || "This Page"}
                          adminToken={adminToken}
                          systemUsers={systemUsers}
                          allBusinessUsers={allBusinessUsers}
                          onSuccess={() => fetchAssignedUsers(selectedPage.id)}
                          existingUserIds={assignedUsers.map(u => u.id)}
                          trigger={
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 text-[9px] gap-1 px-1.5 hover:bg-primary/5 hover:text-primary cursor-pointer border-none shadow-none text-muted-foreground/60"
                            >
                              <Plus className="w-2.5 h-2.5" /> Add User
                            </Button>
                          }
                        />
                    )}
                  </h4>
                  
                  <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/5">
                    {isLoadingUsers ? (
                      <div className="p-12 flex flex-col items-center justify-center space-y-3">
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        <p className="text-[10px] text-muted-foreground animate-pulse font-medium">Loading Assigned People (via FB Assigned Users API)...</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/10">
                        {assignedUsers.length > 0 ? (
                          assignedUsers.map((user) => {
                            const isExpanded = expandedUserId === user.id
                            const isSystemUser = user.name.startsWith("AD -") || user.name.startsWith("EM -")
                            
                            return (
                              <div key={user.id} className="flex flex-col">
                                <div 
                                  className={cn(
                                    "p-3 px-4 flex items-center justify-between hover:bg-muted/40 transition-colors group cursor-pointer select-none",
                                    isExpanded && "bg-muted/20"
                                  )}
                                  onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                                >
                                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black uppercase ring-1 ring-primary/20 shrink-0">
                                      {user.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-[11px] font-bold text-foreground truncate">{user.name}</p>
                                        <Badge variant="outline" className={cn(
                                          "text-[7px] font-bold px-1.5 py-0 h-4 leading-none rounded-full flex items-center shrink-0",
                                          isSystemUser ? "border-green-500/20 bg-green-500/5 text-green-600" : "border-blue-500/20 bg-blue-500/5 text-blue-600"
                                        )}>
                                          {isSystemUser ? 'System User' : 'Business User'}
                                        </Badge>
                                      </div>
                                      <div 
                                        className="flex items-center gap-1 text-[9px] text-muted-foreground/60 font-mono tracking-tighter mt-1 bg-muted/30 px-1.5 py-0.5 rounded w-fit hover:text-primary transition-colors cursor-copy"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          navigator.clipboard.writeText(user.id)
                                          toast.success("User ID Copied")
                                        }}
                                      >
                                        {user.id}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 ml-4 shrink-0">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleUnassignUser(user.id, user.name)
                                      }}
                                      className="p-1.5 rounded-lg border border-destructive/20 text-destructive opacity-30 hover:opacity-100 hover:bg-destructive hover:text-white transition-all cursor-pointer shadow-sm"
                                      title="Revoke Permissions"
                                    >
                                      <LogOut className="w-3 h-3" />
                                    </button>
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-primary" />
                                    ) : (
                                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                                    )}
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-0 border-t border-border/5 bg-muted/20 animate-in slide-in-from-top-1 duration-200">
                                    <div className="flex items-center flex-wrap gap-1.5 mt-3">
                                      <span className="text-[10px] text-muted-foreground/60 w-full mb-1 font-medium">Assigned Tasks:</span>
                                      {user.tasks.map(task => (
                                        <span key={task} className="text-[9px] font-bold border border-green-500/30 text-green-600 px-2 py-0.5 rounded-full whitespace-nowrap bg-transparent">
                                          {formatTask(task)}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })
                        ) : (
                          <div className="p-8 text-center space-y-2">
                            <Users2 className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                            <p className="text-[11px] text-muted-foreground italic">No users assigned to this page yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {groupsContainingPage.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <Package className="w-3 h-3" />
                        Asset Groups ({groupsContainingPage.length})
                      </div>
                      {!isReadOnly && (
                          <AddToGroupDialog 
                            business={business}
                            pageId={selectedPage.id}
                            pageName={selectedPage.name || "This Page"}
                            adminToken={adminToken}
                            onSuccess={() => {
                                if (onRecrawl) onRecrawl()
                            }}
                            trigger={
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 text-[9px] gap-1 px-1.5 hover:bg-primary/5 hover:text-primary cursor-pointer border-none shadow-none text-muted-foreground/60"
                              >
                                <Plus className="w-2.5 h-2.5" /> Add Group
                              </Button>
                            }
                          />
                      )}
                    </h4>
                    <div className="grid gap-2">
                      {groupsContainingPage.map(group => (
                        <div key={group.id} className="p-3 rounded-lg border border-border/40 bg-card flex items-center justify-between group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/5 text-primary">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium">{group.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">ID: {group.id}</p>
                            </div>
                          </div>
                          {!isReadOnly && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                setGroupToRemoveFrom({ id: group.id, name: group.name })
                              }}
                              className="p-1.5 rounded-lg border border-destructive/20 text-destructive opacity-30 hover:opacity-100 hover:bg-destructive hover:text-white transition-all cursor-pointer shadow-sm"
                              title="Remove from Group"
                            >
                              <LogOut className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Revoke Access Modal */}
            <Dialog open={!!userToRevoke} onOpenChange={(open) => !open && setUserToRevoke(null)}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader className="items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <DialogTitle className="text-xl font-bold">Revoke Page Access?</DialogTitle>
                  <DialogDescription className="text-sm pt-2">
                    Are you sure you want to remove <strong>{userToRevoke?.name}</strong> from this page? 
                    <br />This action will immediately terminate their permissions.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setUserToRevoke(null)}
                    className="w-full sm:flex-1 cursor-pointer"
                    disabled={isRevoking}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmRevokeAccess}
                    className="w-full sm:flex-1 cursor-pointer font-bold"
                    disabled={isRevoking}
                  >
                    {isRevoking ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Revoking...
                      </>
                    ) : (
                      "Revoke Access"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Remove Page Modal */}
            <Dialog open={showRemovePageConfirm} onOpenChange={setShowRemovePageConfirm}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader className="items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <DialogTitle className="text-xl font-bold text-destructive">Remove Page from Business?</DialogTitle>
                  <DialogDescription className="text-sm pt-2">
                    Are you sure you want to remove <strong>{selectedPage?.name}</strong> from this Business Manager?
                    <br />This will disconnect the asset globally from this business account.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRemovePageConfirm(false)}
                    className="w-full sm:flex-1 cursor-pointer"
                    disabled={isRemovingPage}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleRemovePage}
                    className="w-full sm:flex-1 cursor-pointer font-bold"
                    disabled={isRemovingPage}
                  >
                    {isRemovingPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      "Remove Page"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={!!groupToRemoveFrom} onOpenChange={(open) => !open && setGroupToRemoveFrom(null)}>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader className="items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                    <AlertCircle className="w-6 h-6 text-destructive" />
                  </div>
                  <DialogTitle className="text-xl font-bold">Remove from Asset Group?</DialogTitle>
                  <DialogDescription className="text-sm pt-2">
                    Are you sure you want to remove <strong>{selectedPage?.name}</strong> from the group <strong>{groupToRemoveFrom?.name}</strong>?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setGroupToRemoveFrom(null)}
                    className="w-full sm:flex-1 cursor-pointer"
                    disabled={isRemovingFromGroup}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={confirmRemoveFromGroup}
                    className="w-full sm:flex-1 cursor-pointer font-bold"
                    disabled={isRemovingFromGroup}
                  >
                    {isRemovingFromGroup ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      "Remove"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : null
      }
    >
      <div className="space-y-6">
        <Section 
          title="Owned Pages" 
          icon={ShieldCheck} 
          count={ownedPages.length}
          action={
            <AddPageDialog 
              businessId={business.id} 
              adminToken={adminToken} 
              onSuccess={onRecrawl} 
              standalonePages={standalonePages}
            />
          }
        >
          {ownedPages.map((page: FacebookPage) => (
            <Item
              key={page.id}
              isSelected={selectedPageId === page.id}
              onClick={() => setSelectedPageId(selectedPageId === page.id ? null : page.id)}
              label={page.name}
              value={page.id}
              subValue={page.category}
              isID
            />
          ))}
        </Section>

        {clientPages.length > 0 && (
          <Section title="Shared / Client Pages" icon={Users2} count={clientPages.length}>
            {clientPages.map((page: FacebookPage) => (
              <Item
                key={page.id}
                isSelected={selectedPageId === page.id}
                onClick={() => setSelectedPageId(selectedPageId === page.id ? null : page.id)}
                label={page.name}
                value={page.id}
                subValue={page.category}
                isID
              />
            ))}
          </Section>
        )}

        {assetGroupPages.length > 0 && (
          <Section title="Asset Group Pages" icon={Package} count={assetGroupPages.length}>
            <div className="mb-2 px-2 py-1.5 rounded-md bg-muted/30 border border-border/50">
              <p className="text-[10px] text-muted-foreground leading-snug">
                These assets are shared via Business Asset Groups. You have read-only access to their information.
              </p>
            </div>
            {assetGroupPages.map((page: FacebookPage) => (
              <Item
                key={page.id}
                isSelected={selectedPageId === page.id}
                onClick={() => setSelectedPageId(selectedPageId === page.id ? null : page.id)}
                label={page.name}
                value={page.id}
                subValue={page.category}
                isID
              />
            ))}
          </Section>
        )}

        {!business.pages?.length && <p className="text-xs text-muted-foreground italic pl-2">No pages found</p>}
      </div>
    </DetailContainer>
  )
}

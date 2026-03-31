"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { Users2, ShieldCheck, User, Fingerprint, Package, Flag, Layers, Layout, LogOut, Loader2, Pencil, KeyRound, Zap, ChevronRight, Copy, Clock, Globe } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BusinessRow, SystemUser } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"
import { cn } from "@/lib/utils"
import { AddSystemUserDialog } from "./AddSystemUserDialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

interface TeamTabProps {
  business: BusinessRow
  systemUsers: SystemUser[]
  currentUser: SystemUser | null
  allBusinessUsers: { id: string; name: string; email?: string; role?: string }[]
  onRecrawl?: () => void
  adminToken: string
}

export const TeamTab = ({ business, systemUsers, currentUser, allBusinessUsers, onRecrawl, adminToken }: TeamTabProps) => {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserType, setSelectedUserType] = useState<'business' | 'system' | 'local' | null>(null)
  const [expandedLocalUserId, setExpandedLocalUserId] = useState<string | null>(null)
  const [assignedGroups, setAssignedGroups] = useState<{ id: string; name: string; contained_pages?: { data: unknown[] }; contained_ad_accounts?: { data: unknown[] }; contained_applications?: { data: unknown[] } }[]>([])
  const [assignedPages, setAssignedPages] = useState<{ id: string; name: string }[]>([])
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [systemUserActionToken, setSystemUserActionToken] = useState<string | null>(null)
  const [isAssignGroupOpen, setIsAssignGroupOpen] = useState(false)
  const [isAssignPageOpen, setIsAssignPageOpen] = useState(false)
  const [isAssignAppOpen, setIsAssignAppOpen] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedPageTasks, setSelectedPageTasks] = useState<string[]>(["MANAGE", "CREATE_CONTENT", "MODERATE", "ADVERTISE", "ANALYZE"])

  // --- System User management task states ---
  const [isRenameUserOpen, setIsRenameUserOpen] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [isRenamingUser, setIsRenamingUser] = useState(false)
  const [isRevokeOpen, setIsRevokeOpen] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  // --- Account User (business): use standard user access token ---
  const fetchBusinessUserAssets = useCallback(async (userId: string) => {
    setIsLoadingAssets(true)
    try {
      const [groupsRes, pagesRes] = await Promise.all([
        fetch(`/api/facebook/business/${business.id}/users/${userId}/asset-groups?token=${adminToken}`),
        fetch(`/api/facebook/business/${business.id}/users/${userId}/assigned-pages?token=${adminToken}`)
      ])
      const [groupsData, pagesData] = await Promise.all([groupsRes.json(), pagesRes.json()])
      if (groupsData.success) setAssignedGroups(groupsData.data || [])
      else setAssignedGroups([])
      if (pagesData.success) setAssignedPages(pagesData.data || [])
      else setAssignedPages([])
    } catch (err) {
      console.error("[BusinessUser] Failed to fetch assets:", err)
      setAssignedGroups([])
      setAssignedPages([])
    } finally {
      setIsLoadingAssets(false)
    }
  }, [business.id, adminToken])

  // --- System User (system / local): now unified to use the standard assigned_pages API ---
  const fetchSystemUserAssets = useCallback(async (userId: string) => {
    setIsLoadingAssets(true)
    setSystemUserActionToken(null)
    try {
      // 1. Fetch Asset Groups (Standard)
      const [groupsRes, pagesRes] = await Promise.all([
        fetch(`/api/facebook/business/${business.id}/users/${userId}/asset-groups?token=${adminToken}`),
        fetch(`/api/facebook/business/${business.id}/users/${userId}/assigned-pages?token=${adminToken}`)
      ])
      
      const [groupsData, pagesData] = await Promise.all([groupsRes.json(), pagesRes.json()])
      
      if (groupsData.success) setAssignedGroups(groupsData.data || [])
      else setAssignedGroups([])
      
      if (pagesData.success) {
        setAssignedPages(pagesData.data || [])
      } else {
        setAssignedPages([])
      }
    } catch (err) {
      console.error("[SystemUser] Failed to fetch assets:", err)
      setAssignedGroups([])
      setAssignedPages([])
    } finally {
      setIsLoadingAssets(false)
    }
  }, [business.id, adminToken])

  // Helper: call the correct fetch based on current userType — replacing old fetchAssignedAssets
  const refreshAssets = useCallback((userId: string, userType: typeof selectedUserType) => {
    if (!userId || !userType) return
    if (userType === 'business') {
      fetchBusinessUserAssets(userId)
    } else {
      fetchSystemUserAssets(userId)
    }
  }, [fetchBusinessUserAssets, fetchSystemUserAssets])

  useEffect(() => {
    // Clear old data when selection changes
    setAssignedGroups([])
    setAssignedPages([])
    
    if (selectedUserId && selectedUserType) {
      refreshAssets(selectedUserId, selectedUserType)
    } else if (expandedLocalUserId) {
      refreshAssets(expandedLocalUserId, 'local')
    }
  }, [selectedUserId, selectedUserType, expandedLocalUserId, refreshAssets])

  const handleAssignToGroup = async (groupId: string) => {
    if (!selectedUserId) return
    setIsAssigning(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${groupId}?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_user", userId: selectedUserId })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to assign to group")
      
      toast.success("User assigned to group successfully")
      setIsAssignGroupOpen(false)
      refreshAssets(selectedUserId, selectedUserType)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleAssignToPage = async (pageId: string) => {
    if (!selectedUserId) return
    setIsAssigning(true)
    try {
      const effectiveToken = (selectedUserType === 'system' || selectedUserType === 'local') && systemUserActionToken 
        ? systemUserActionToken 
        : adminToken
        
      const res = await fetch(`/api/facebook/business/${business.id}/pages/${pageId}/users?token=${encodeURIComponent(effectiveToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: selectedUserId, 
          tasks: selectedPageTasks,
          userType: selectedUserType
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to assign page")
      
      toast.success("User assigned to page successfully")
      setIsAssignPageOpen(false)
      refreshAssets(selectedUserId, selectedUserType)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed")
    } finally {
      setIsAssigning(false)
    }
  }

  const handleAssignToApp = async (appId: string) => {
    if (!selectedUserId) return
    setIsAssigning(true)
    try {
      const effectiveToken = (selectedUserType === 'system' || selectedUserType === 'local') && systemUserActionToken 
        ? systemUserActionToken 
        : adminToken

      const res = await fetch(`/api/facebook/business/${business.id}/apps/${appId}/users?token=${encodeURIComponent(effectiveToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: selectedUserId,
          userType: selectedUserType
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to assign app")
      
      toast.success("User assigned to app successfully")
      setIsAssignAppOpen(false)
      refreshAssets(selectedUserId, selectedUserType)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assignment failed")
    } finally {
      setIsAssigning(false)
    }
  }

  const filteredSystemUsers = useMemo(
    () => systemUsers?.filter(u => (u.businessId || "").trim() === (business.id || "").trim()) || [],
    [systemUsers, business.id]
  )
  const formatRole = (role?: string) => {
    if (!role) return ""
    const upper = role.toUpperCase()
    if (upper === "AD") return "Admin"
    if (upper === "EM") return "Employee"
    
    return role
      .toLowerCase()
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  const isYou = selectedUserId === currentUser?.id

  const unifiedUser = React.useMemo(() => {
    if (!selectedUserId) return null
    const source = (selectedUserType === 'business' ? allBusinessUsers.find(u => u.id === selectedUserId) :
                  selectedUserType === 'system' ? business.system_users?.find(u => u.id === selectedUserId) :
                  filteredSystemUsers.find(u => u.id === selectedUserId)) as SystemUser | { id: string; name: string; email?: string; role?: string; appName?: string; permitted_roles?: string[] } | undefined
    
    if (!source) return null

    // Determine roles and badges
    const badges: { label: string, colorClass: string }[] = []
    
    let displayRole = source.role || (source as SystemUser).roleCode || ""
    if (isYou && business.permitted_roles?.length) {
      displayRole = business.permitted_roles.join(", ").toUpperCase()
    } else if (!displayRole) {
      displayRole = selectedUserType === 'system' ? 'System User' : 'Partner'
    }

    if (source.appName) {
      badges.push({ label: `app: ${source.appName}`, colorClass: "border-blue-200 bg-blue-50 text-blue-600" })
    }
    if (selectedUserType === 'local') {
      badges.push({ label: "local db", colorClass: "border-amber-200 bg-amber-50 text-amber-600 uppercase" })
    }

    return {
      id: selectedUserId,
      name: source.name + (isYou ? " (You)" : ""),
      email: source.email,
      role: formatRole(displayRole),
      badges,
      appName: source.appName,
      type: selectedUserType,
      isYou
    }
  }, [selectedUserId, selectedUserType, allBusinessUsers, business, filteredSystemUsers, isYou])

  
  const handleRemoveAsset = async (e: React.MouseEvent, assetName: string, assetType: string, assetId?: string) => {
    e.stopPropagation()
    if (assetType === "Asset Group" && assetId && selectedUserId) {
      try {
        const url = `/api/facebook/business/${business.id}/asset-groups/${assetId}?token=${encodeURIComponent(adminToken)}&action=remove_user&userId=${selectedUserId}`
        const res = await fetch(url, { method: "DELETE" })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || "Failed to remove user from group")
        
        toast.success(`Removed ${unifiedUser?.name || 'user'} from group: ${assetName}`)
        refreshAssets(selectedUserId, selectedUserType)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove")
      }
    } else if (assetType === "Page" && assetId && selectedUserId) {
      try {
        // Use unorthodox token if available (AD token for EM users, or own token for AD)
        const effectiveToken = (selectedUserType === 'system' || selectedUserType === 'local') && systemUserActionToken 
          ? systemUserActionToken 
          : adminToken
        
        const url = `/api/facebook/business/${business.id}/pages/${assetId}/users?token=${encodeURIComponent(effectiveToken)}&userId=${selectedUserId}`
        const res = await fetch(url, { method: "DELETE" })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || "Failed to unassign page")
        
        toast.success(`Unassigned user from page: ${assetName}`)
        refreshAssets(selectedUserId, selectedUserType)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove")
      }
    } else if (assetType === "App" && assetId && selectedUserId) {
      try {
        const url = `/api/facebook/business/${business.id}/apps/${assetId}/users?token=${encodeURIComponent(adminToken)}&userId=${selectedUserId}`
        const res = await fetch(url, { method: "DELETE" })
        const data = await res.json()
        if (!res.ok || data.error) throw new Error(data.error || "Failed to unassign app")
        
        toast.success(`Unassigned user from app: ${assetName}`)
        refreshAssets(selectedUserId, selectedUserType)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to remove")
      }
    } else {
      toast.info(`Removal for ${assetType} is not implemented yet`)
    }
  }

  const handleRenameUser = async () => {
    if (!selectedUserId || !newUserName.trim()) return
    setIsRenamingUser(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/system-users/${selectedUserId}?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newUserName.trim() })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to rename user")
      
      toast.success("User renamed successfully")
      setIsRenameUserOpen(false)
      if (onRecrawl) onRecrawl()
      // Refresh the selected user's assets if necessary, although name changed
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rename failed")
    } finally {
      setIsRenamingUser(false)
    }
  }

  const handleRevokeTokens = async () => {
    if (!selectedUserId) return
    setIsRevoking(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/system-users/${selectedUserId}?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke_tokens" })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to revoke tokens")
      
      toast.success("All access tokens revoked successfully")
      setIsRevokeOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Revoke failed")
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <DetailContainer
      isOpen={!!selectedUserId && selectedUserType !== 'local'}
      onClose={() => { setSelectedUserId(null); setSelectedUserType(null); }}
      detailContent={
        unifiedUser ? (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium tracking-tight flex items-center flex-wrap gap-2">
                    {unifiedUser.name}
                    <div className="flex gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-normal h-5 border-primary/20 bg-primary/5 text-primary">
                        {unifiedUser.role}
                      </Badge>
                      {unifiedUser.badges.map((badge, idx) => (
                        <Badge key={idx} variant="outline" className={cn("text-[10px] font-normal h-5", badge.colorClass)}>
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  </h3>
                  
                  <div className="flex flex-col gap-1.5 mt-2.5">
                    <div 
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono cursor-pointer hover:text-primary transition-colors w-fit"
                      onClick={() => {
                        if (unifiedUser.id) {
                          navigator.clipboard.writeText(unifiedUser.id)
                          toast.success("ID Copied")
                        }
                      }}
                      title="Click to copy ID"
                    >
                      <Fingerprint className="w-3 h-3" />
                      ID: {unifiedUser.id}
                    </div>
                    {unifiedUser.email && (
                      <div 
                        className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 italic hover:text-primary transition-colors cursor-pointer w-fit"
                        onClick={() => {
                          navigator.clipboard.writeText(unifiedUser.email!)
                          toast.success("Email Copied")
                        }}
                        title="Click to copy email"
                      >
                        <User className="w-3 h-3" />
                        Email: {unifiedUser.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(selectedUserType === 'system' || selectedUserType === 'local') && (
              <div className="space-y-4">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Management Tasks
                </h4>
                <div className="grid gap-2">
                  {[
                    { 
                      label: "Change name", 
                      description: "Update the display name of this system user", 
                      icon: Pencil, 
                      action: () => {
                        setNewUserName(unifiedUser?.name.replace(" (You)", "") || "")
                        setIsRenameUserOpen(true)
                      }
                    },
                    { 
                      label: "Revoke all access tokens", 
                      description: "Invalidate every access token for this user", 
                      icon: KeyRound, 
                      action: () => setIsRevokeOpen(true)
                    }
                  ].map((task, i) => (
                    <button 
                      key={i} 
                      onClick={task.action}
                      className="p-3 w-full text-left rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/5">
                          <task.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium">{task.label}</p>
                          <p className="text-[10px] text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium tracking-wider text-muted-foreground flex items-center gap-2">
                  <Package className="w-3 h-3" />
                  Assigned Assets
                </h4>
              </div>
 
              <div className="grid gap-4">
                {isLoadingAssets ? (
                  <div className="py-12 flex flex-col items-center justify-center space-y-3 border border-dashed border-border/60 rounded-xl">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <p className="text-[10px] text-muted-foreground animate-pulse">Fetching assigned assets...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pages Block */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-[10px] text-muted-foreground capitalize">
                          Pages {assignedPages.length > 0 ? `(${assignedPages.length})` : ""}
                        </div>
                        {selectedUserId && !isYou && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 text-[9px] gap-1 px-1.5 hover:bg-primary/5 hover:text-primary cursor-pointer border-none shadow-none text-muted-foreground/60"
                            onClick={() => setIsAssignPageOpen(true)}
                          >
                            <Plus className="w-2.5 h-2.5" /> Assign Page
                          </Button>
                        )}
                      </div>
                      {assignedPages.length > 0 ? (
                        <div className="max-h-[500px] overflow-y-auto pr-1 space-y-0 custom-scrollbar border border-border/40 rounded-lg overflow-hidden">
                          {assignedPages.map((page) => (
                            <div key={page.id} className={cn(
                              "py-1.5 px-2 bg-card flex items-center justify-between group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0"
                            )}>
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-5 h-5 bg-blue-50 rounded flex items-center justify-center shrink-0">
                                  <Flag className="w-3 h-3 text-blue-600" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-xs font-medium truncate max-w-[300px]">{page.name}</p>
                                  <span className="text-[9px] text-muted-foreground font-mono tabular-nums leading-none mt-0.5">ID: {page.id}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-[9px] shrink-0">
                                <button
                                  onClick={(e) => handleRemoveAsset(e, page.name || "Unknown Page", "Page", page.id)}
                                  className="p-1 border border-destructive/30 text-destructive hover:bg-red-600/10 rounded transition-all cursor-pointer shadow-sm"
                                  title="Unassign Page"
                                >
                                  <LogOut className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed border-border/40 rounded-lg text-center">
                          <p className="text-[10px] text-muted-foreground italic">No assigned data</p>
                        </div>
                      )}
                    </div>

                    {/* Applications Block */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-[10px] text-muted-foreground capitalize">Applications</div>
                        {selectedUserId && !isYou && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 text-[9px] gap-1 px-1.5 hover:bg-primary/5 hover:text-primary cursor-pointer border-none shadow-none text-muted-foreground/60"
                            onClick={() => setIsAssignAppOpen(true)}
                          >
                            <Plus className="w-2.5 h-2.5" /> Assign App
                          </Button>
                        )}
                      </div>
                      {unifiedUser.appName ? (
                        <div className="p-3 bg-card border border-border/40 rounded-lg flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-semibold shrink-0">
                              <Layout className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <p className="text-xs font-medium truncate">{unifiedUser.appName}</p>
                              <p className="text-[9px] text-muted-foreground font-mono">Managed via local database • ID: {unifiedUser.id}</p>
                            </div>
                            <button
                              onClick={(e) => handleRemoveAsset(e, unifiedUser.appName || "Application", "App", unifiedUser.id)}
                              className="p-1 border border-destructive/30 text-destructive hover:bg-red-600/10 rounded transition-all cursor-pointer shadow-sm"
                              title="Unassign Application"
                            >
                              <LogOut className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed border-border/40 rounded-lg text-center">
                          <p className="text-[10px] text-muted-foreground italic">No assigned data</p>
                        </div>
                      )}
                    </div>

                    {/* Asset Groups Block */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-1">
                        <div className="text-[10px] text-muted-foreground capitalize">
                          Asset groups {assignedGroups.length > 0 ? `(${assignedGroups.length})` : ""}
                        </div>
                        {selectedUserId && !isYou && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 text-[9px] gap-1 px-1.5 hover:bg-primary/5 hover:text-primary cursor-pointer border-none shadow-none text-muted-foreground/60"
                            onClick={() => setIsAssignGroupOpen(true)}
                          >
                            <Plus className="w-2.5 h-2.5" /> Assign Group
                          </Button>
                        )}
                      </div>
                      {assignedGroups.length > 0 ? (
                        <div className="max-h-[450px] overflow-y-auto pr-1 space-y-0 custom-scrollbar border border-border/40 rounded-lg overflow-hidden">
                          {assignedGroups.map((group) => (
                            <div key={group.id} className={cn(
                              "py-1.5 px-2 bg-card flex items-center justify-between group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0"
                            )}>
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-5 h-5 bg-purple-50 rounded flex items-center justify-center shrink-0">
                                  <Layers className="w-3 h-3 text-purple-600" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <p className="text-xs font-medium truncate max-w-[250px]">{group.name}</p>
                                  <span className="text-[9px] text-muted-foreground font-mono tabular-nums leading-none mt-0.5">ID: {group.id}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-[9px] shrink-0">
                                <div className="flex items-center gap-1.5 mr-1 text-muted-foreground">
                                  {group.contained_pages?.data && (
                                    <span>{group.contained_pages.data.length} Pages</span>
                                  )}
                                  {group.contained_pages?.data && (group.contained_ad_accounts?.data || group.contained_applications?.data) && (
                                    <span>•</span>
                                  )}
                                  {group.contained_ad_accounts?.data && (
                                    <span>{group.contained_ad_accounts.data.length} Ad accounts</span>
                                  )}
                                  {group.contained_ad_accounts?.data && group.contained_applications?.data && (
                                    <span>•</span>
                                  )}
                                  {group.contained_applications?.data && (
                                    <span>{group.contained_applications.data.length} Apps</span>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => handleRemoveAsset(e, group.name || "Unknown asset group", "Asset Group", group.id)}
                                  className="p-1 border border-destructive/30 text-destructive hover:bg-red-600/10 rounded transition-all cursor-pointer shadow-sm"
                                  title="Unassign Group"
                                >
                                  <LogOut className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed border-border/40 rounded-lg text-center">
                          <p className="text-[10px] text-muted-foreground italic">No assigned data</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Select a user to view details</div>
        )
      }
    >

      <Section title="Business Users" icon={Users2} count={allBusinessUsers.length > 0 ? allBusinessUsers.length : undefined}>
        {allBusinessUsers.map((user) => {
          const isUserYou = user.id === currentUser?.id
          const displayRoles = isUserYou && business.permitted_roles && business.permitted_roles.length > 0
            ? business.permitted_roles.map(r => r.toUpperCase()).join(", ")
            : user.role

          return (
            <Item
              key={user.id}
              isSelected={selectedUserId === user.id}
              onClick={() => {
                if (selectedUserId === user.id) {
                  setSelectedUserId(null)
                  setSelectedUserType(null)
                } else {
                  setSelectedUserId(user.id)
                  setSelectedUserType('business')
                }
              }}
              label={user.name + (isUserYou ? " (You)" : "")}
              value={user.id}
              subValue={formatRole(displayRoles)}
              isID
              status={undefined}
            />
          )
        })}
        {!allBusinessUsers.length && <p className="text-xs text-muted-foreground italic pl-2">No users listed</p>}
      </Section>

      <Section 
        title="System Users" 
        icon={ShieldCheck} 
        count={business.system_users?.length ? business.system_users.length : undefined}
        action={
          <AddSystemUserDialog 
            businessId={business.id} 
            adminToken={adminToken} 
            onSuccess={onRecrawl} 
            existingUsers={business.system_users || []}
            verificationStatus={business.verification_status || 'not_verified'}
          />
        }
      >
        {business.system_users?.map((u) => (
          <Item
            key={u.id}
            isSelected={selectedUserId === u.id}
            onClick={() => {
              if (selectedUserId === u.id) {
                setSelectedUserId(null)
                setSelectedUserType(null)
              } else {
                setSelectedUserId(u.id)
                setSelectedUserType('system')
              }
            }}
            label={u.name}
            value={u.id}
            subValue={formatRole(u.role || "System User")}
            isID
          />
        ))}
        {!business.system_users?.length && <p className="text-xs text-muted-foreground italic pl-2">No system users found via FB API</p>}
      </Section>

      <Section title="System User (Local DB)" icon={ShieldCheck} count={filteredSystemUsers.length > 0 ? filteredSystemUsers.length : undefined}>
        {filteredSystemUsers.map((su) => {
          const isExpanded = expandedLocalUserId === su.id
          return (
            <Item
              key={su.id}
              isSelected={false}
              isExpanded={isExpanded}
              onClick={() => setExpandedLocalUserId(isExpanded ? null : su.id)}
              label={su.name}
              value={su.id}
              subValue={[formatRole(su.role || "System User"), su.appName].filter(Boolean).join(" • ")}
              status={su.status}
              isID
              expandableContent={
                <div className="space-y-3 pt-2">
                  {/* Compact Info Row */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="font-medium">{su.description || "—"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-nowrap">Business name:</span>
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3 text-primary/40" />
                        <span className="font-medium">{su.businessName || "—"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Role code:</span>
                      <Badge variant="outline" className="h-4 px-1 text-[9px] font-mono border-muted-foreground/20">{su.roleCode || "—"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={cn("font-bold", su.status === 'Active' ? "text-green-600" : "text-amber-600")}>{su.status}</span>
                    </div>
                  </div>

                  {/* Token & Assets Row */}
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    {su.token && (
                      <div className="flex items-center gap-3 min-w-0 max-w-[400px]">
                        <span className="text-[10px] text-muted-foreground shrink-0">Access token:</span>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="font-mono text-[9px] text-muted-foreground/70 truncate bg-muted/20 px-1.5 py-0.5 rounded border border-border/40">
                            {su.token.substring(0, 15)}...{su.token.substring(su.token.length - 10)}
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(su.token!)
                              toast.success("Token copied")
                            }}
                            className="p-1 hover:bg-primary/10 rounded transition-colors text-primary shrink-0"
                            title="Copy full token"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                        <Package className="w-3 h-3" /> Assigned assets:
                      </span>
                      {isLoadingAssets && expandedLocalUserId === su.id ? (
                        <Loader2 className="w-3 h-3 text-primary animate-spin" />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {assignedPages.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              {assignedPages.slice(0, 3).map(page => (
                                <Badge key={page.id} variant="secondary" className="h-4 px-1.5 text-[9px] font-normal bg-blue-50 text-blue-600 border-blue-100">
                                  {page.name}
                                </Badge>
                              ))}
                              {assignedPages.length > 3 && (
                                <span className="text-[9px] text-muted-foreground italic">
                                  + {assignedPages.length - 3} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] text-muted-foreground italic">None found</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timestamps Row */}
                  <div className="pt-2 border-t border-border/20 flex items-center gap-6 text-[9px] text-muted-foreground/50">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Created at: {su.createdAt ? new Date(su.createdAt).toLocaleDateString() : "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>Updated at: {su.updatedAt ? new Date(su.updatedAt).toLocaleDateString() : "—"}</span>
                    </div>
                  </div>
                </div>
              }
            />
          )
        })}
        {!filteredSystemUsers.length && <p className="text-xs text-muted-foreground italic pl-2">No local system users found</p>}
      </Section>
      <Dialog open={isAssignGroupOpen} onOpenChange={(open) => !isAssigning && setIsAssignGroupOpen(open)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign to Asset Group</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground">Select a business asset group</label>
              <div className="grid gap-1 max-h-[400px] overflow-y-auto pr-1">
                {business.business_asset_groups?.data?.map((group) => {
                  const alreadyAssigned = assignedGroups.some(ag => String(ag.id) === String(group.id));
                  return (
                    <button
                      key={group.id}
                      onClick={() => handleAssignToGroup(group.id)}
                      disabled={isAssigning || alreadyAssigned}
                      className={cn(
                        "flex flex-col p-2.5 rounded-lg border border-border/40 text-left transition-colors group cursor-pointer",
                        alreadyAssigned ? "opacity-50 cursor-not-allowed bg-muted/20" : "hover:border-primary/50 bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-xs font-semibold shrink-0">
                            <Layers className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-xs font-medium truncate">{group.name}</p>
                            {alreadyAssigned && <p className="text-[9px] text-primary font-medium">Already assigned</p>}
                          </div>
                        </div>
                        {!alreadyAssigned && <Plus className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />}
                      </div>
                    </button>
                  )
                })}
                {!business.business_asset_groups?.data?.length && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No asset groups available</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsAssignGroupOpen(false)} disabled={isAssigning}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Page Dialog */}
      <Dialog open={isAssignPageOpen} onOpenChange={(open) => !isAssigning && setIsAssignPageOpen(open)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign to Page</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-2.5">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">Permissions to grant</label>
              <div className="grid grid-cols-2 gap-2 p-3 bg-muted/20 border border-border/40 rounded-xl">
                {[
                  { id: "MANAGE", label: "Manage Page" },
                  { id: "CREATE_CONTENT", label: "Create Content" },
                  { id: "MODERATE", label: "Moderate" },
                  { id: "ADVERTISE", label: "Advertise" },
                  { id: "ANALYZE", label: "Analyze" }
                ].map((task) => (
                  <label key={task.id} className="flex items-center gap-2 text-[10px] font-medium cursor-pointer group">
                    <div 
                      className={cn(
                        "w-3.5 h-3.5 rounded border flex items-center justify-center transition-all",
                        selectedPageTasks.includes(task.id) 
                          ? "bg-primary border-primary text-primary-foreground" 
                          : "border-muted-foreground/30 group-hover:border-primary/50"
                      )}
                      onClick={() => {
                        setSelectedPageTasks(prev => 
                          prev.includes(task.id) 
                            ? prev.filter(t => t !== task.id) 
                            : [...prev, task.id]
                        )
                      }}
                    >
                      {selectedPageTasks.includes(task.id) && <Users2 className="w-2 h-2" />}
                    </div>
                    {task.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-tight">Select a business page</label>
              <div className="grid gap-1 max-h-[300px] overflow-y-auto pr-1">
                {business.pages?.map((page) => {
                  const alreadyAssigned = assignedPages.some(ap => String(ap.id) === String(page.id));
                  return (
                    <button
                      key={page.id}
                      onClick={() => handleAssignToPage(page.id)}
                      disabled={isAssigning || alreadyAssigned}
                      className={cn(
                        "flex flex-col p-2.5 rounded-lg border border-border/40 text-left transition-colors group cursor-pointer",
                        alreadyAssigned ? "opacity-50 cursor-not-allowed bg-muted/20" : "hover:border-primary/50 bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-semibold shrink-0">
                            <Flag className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-xs font-medium truncate">{page.name}</p>
                            {alreadyAssigned && <p className="text-[9px] text-primary font-medium">Already assigned</p>}
                          </div>
                        </div>
                        {!alreadyAssigned && <Plus className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />}
                      </div>
                    </button>
                  )
                })}
                {!business.pages?.length && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No pages available</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign App Dialog */}
      <Dialog open={isAssignAppOpen} onOpenChange={(open) => !isAssigning && setIsAssignAppOpen(open)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign to Application</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground">Select an application</label>
              <div className="grid gap-1 max-h-[400px] overflow-y-auto pr-1">
                {business.apps?.map((app) => {
                  const alreadyAssigned = unifiedUser?.appName === app.name;
                  return (
                    <button
                      key={app.id}
                      onClick={() => handleAssignToApp(app.id)}
                      disabled={isAssigning || alreadyAssigned}
                      className={cn(
                        "flex flex-col p-2.5 rounded-lg border border-border/40 text-left transition-colors group cursor-pointer",
                        alreadyAssigned ? "opacity-50 cursor-not-allowed bg-muted/20" : "hover:border-primary/50 bg-card"
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-xs font-semibold shrink-0">
                            <Layout className="w-4 h-4 text-orange-600" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <p className="text-xs font-medium truncate">{app.name}</p>
                            {alreadyAssigned && <p className="text-[9px] text-primary font-medium">Already assigned</p>}
                          </div>
                        </div>
                        {!alreadyAssigned && <Plus className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />}
                      </div>
                    </button>
                  )
                })}
                {!business.apps?.length && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No applications available</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isRenameUserOpen} onOpenChange={(open) => !isRenamingUser && setIsRenameUserOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Name</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter new name"
              disabled={isRenamingUser}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsRenameUserOpen(false)} disabled={isRenamingUser}>
              Cancel
            </Button>
            <Button 
              onClick={handleRenameUser} 
              disabled={isRenamingUser || !newUserName.trim()}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isRenamingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isRevokeOpen} onOpenChange={(open) => !isRevoking && setIsRevokeOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke All Access Tokens</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">
            Are you sure you want to revoke every access token for <strong>{unifiedUser?.name}</strong>? All applications using these tokens will stop working immediately until new tokens are generated.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsRevokeOpen(false)} disabled={isRevoking}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRevokeTokens} 
              disabled={isRevoking}
              className="cursor-pointer shadow-sm"
            >
              {isRevoking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Revoke Sessions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </DetailContainer>
  )
}

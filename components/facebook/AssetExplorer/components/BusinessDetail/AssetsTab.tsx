"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Layers, Zap, MessageSquare, Pencil, Globe, Users, Trash2, ChevronRight, Fingerprint, Loader2, Plus, Layout, Instagram, Database, Search, SearchX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface AssetGroupDetails {
  id: string
  name: string
  assigned_users?: { 
    data: { 
      id: string; 
      name?: string; 
      email?: string; 
      role?: string;
      page_roles?: string[];
      adaccount_roles?: string[];
      pixel_roles?: string[];
      offline_conversion_data_set_roles?: string[];
      instagram_roles?: string[];
      app_roles?: string[];
      page_tasks?: string[];
    }[] 
  }
  contained_pages?: { data: { id: string; name: string }[] }
  contained_ad_accounts?: { data: { id: string; name: string; account_id: string; currency: string }[] }
  contained_ads_pixels?: { data: { id: string; name: string }[] }
  contained_applications?: { data: { id: string; name: string; category: string }[] }
  contained_instagram_accounts?: { data: { id: string; username: string; name: string }[] }
  contained_offline_conversion_data_sets?: { data: { id: string; name: string }[] }
}

interface AssetsTabProps {
  business: BusinessRow
  adminToken: string
  allBusinessUsers?: { id: string; name: string; email?: string; role?: string }[]
}

export const AssetsTab = ({ business, adminToken, allBusinessUsers }: AssetsTabProps) => {
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<string | null>(null)
  const [selectedPixelId, setSelectedPixelId] = useState<string | null>(null)
  const [selectedWhatsAppId, setSelectedWhatsAppId] = useState<string | null>(null)
  const [assetGroupDetails, setAssetGroupDetails] = useState<AssetGroupDetails | null>(null)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [isLoadingAssets, setIsLoadingAssets] = useState(false)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [assetSearchQuery, setAssetSearchQuery] = useState("")
  
  const totalAssetsCount = (assetGroupDetails?.contained_pages?.data?.length || 0) +
                        (assetGroupDetails?.contained_ad_accounts?.data?.length || 0) +
                        (assetGroupDetails?.contained_ads_pixels?.data?.length || 0) +
                        (assetGroupDetails?.contained_instagram_accounts?.data?.length || 0) +
                        (assetGroupDetails?.contained_applications?.data?.length || 0) +
                        (assetGroupDetails?.contained_offline_conversion_data_sets?.data?.length || 0);

  const assetBreakdown = [
    { label: 'pages', count: assetGroupDetails?.contained_pages?.data?.length || 0 },
    { label: 'ad accounts', count: assetGroupDetails?.contained_ad_accounts?.data?.length || 0 },
    { label: 'pixels', count: assetGroupDetails?.contained_ads_pixels?.data?.length || 0 },
    { label: 'instagram', count: assetGroupDetails?.contained_instagram_accounts?.data?.length || 0 },
    { label: 'apps', count: assetGroupDetails?.contained_applications?.data?.length || 0 },
    { label: 'offline data sets', count: assetGroupDetails?.contained_offline_conversion_data_sets?.data?.length || 0 },
  ]
    .filter(item => item.count > 0)
    .map(item => `${item.count} ${item.label}${item.count > 1 ? '' : ''}`) // Keeping singular/plural logic simple as user used "pages", "app"
    .join(', ');

  const clearSelections = () => {
    setSelectedAssetGroupId(null)
    setSelectedPixelId(null)
    setSelectedWhatsAppId(null)
    setAssetGroupDetails(null)
  }

  const selectedId = selectedAssetGroupId || selectedPixelId || selectedWhatsAppId
  const type = selectedAssetGroupId ? "Asset Group" : selectedPixelId ? "Tracking Pixel" : "WhatsApp Account"
  const selectedItem =
    (selectedAssetGroupId ? business.business_asset_groups?.data?.find(g => g.id === selectedAssetGroupId) :
      selectedPixelId ? business.adspixels?.data?.find(p => p.id === selectedPixelId) :
        business.whatsapp_business_accounts?.data?.find(w => w.id === selectedWhatsAppId)) as { id: string; name: string } | undefined

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)

  const [assetGroupToDelete, setAssetGroupToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false)
  const [isAddAssetOpen, setIsAddAssetOpen] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  const fetchDetails = useCallback(async (groupId: string, section?: string) => {
    const isUser = section === 'users'
    const isAsset = section && section !== 'users' && section !== 'all'
    const isAll = !section || section === 'all'

    try {
      if (isUser || isAll) setIsLoadingUsers(true)
      if (isAsset || isAll) setIsLoadingAssets(true)

      const url = `/api/facebook/business/${business.id}/asset-groups/${groupId}?token=${encodeURIComponent(adminToken)}${section ? `&section=${section}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setAssetGroupDetails(prev => {
          if (!prev || isAll) return data.data;
          return {
            ...prev,
            ...data.data
          };
        })
      }
    } catch (error) {
      console.error("Error fetching asset group details:", error)
    } finally {
      if (isUser || isAll) setIsLoadingUsers(false)
      if (isAsset || isAll) setIsLoadingAssets(false)
    }
  }, [business.id, adminToken])

  useEffect(() => {
    if (selectedAssetGroupId) {
      fetchDetails(selectedAssetGroupId)
    } else {
      setAssetGroupDetails(null)
    }
  }, [selectedAssetGroupId, fetchDetails])

  const copyId = () => {
    if (selectedItem?.id) {
      navigator.clipboard.writeText(selectedItem.id)
      toast.success("ID Copied")
    }
  }

  const handleRename = async () => {
    if (!selectedAssetGroupId || !newName.trim()) return;
    try {
      setIsRenaming(true)
      const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${selectedAssetGroupId}?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to rename asset group")
      
      toast.success("Asset group renamed successfully")
      setIsRenameDialogOpen(false)
      
      // Optimistic update
      if (selectedItem) {
        selectedItem.name = newName.trim()
      }
      
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename")
    } finally {
      setIsRenaming(false)
    }
  }

  const handleAction = async (action: string, payload: Record<string, string | null | undefined> = {}) => {
    try {
      setIsProcessingAction(true)
      const isDelete = action.startsWith('remove_')
      const finalUrl = isDelete 
        ? `/api/facebook/business/${business.id}/asset-groups/${selectedAssetGroupId}?token=${encodeURIComponent(adminToken)}&action=${action}&userId=${payload.userId || ''}&assetId=${payload.assetId || ''}&type=${payload.type || ''}`
        : `/api/facebook/business/${business.id}/asset-groups/${selectedAssetGroupId}?token=${encodeURIComponent(adminToken)}`

      const res = await fetch(finalUrl, {
        method: isDelete ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: isDelete ? undefined : JSON.stringify({ action, ...payload })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || `Failed to ${action}`)
      
      if (data.success) {
        toast.success(`${action.replace('_', ' ')} successful`)
        
        // Determine which section to reload
        let section = 'all'
        if (action.includes('user')) {
          section = 'users'
        } else if (payload.type) {
          const edgeMap: Record<string, string> = {
            PAGE: "contained_pages",
            AD_ACCOUNT: "contained_ad_accounts",
            ADS_PIXEL: "contained_ads_pixels",
            APPLICATION: "contained_applications",
            INSTAGRAM_ACCOUNT: "contained_instagram_accounts",
            OFFLINE_CONVERSION_DATA_SET: "contained_offline_conversion_data_sets"
          }
          section = edgeMap[payload.type] || 'assets'
        }
        
        fetchDetails(selectedAssetGroupId!, section)
        
        if (action === 'add_user') setIsAssignUserOpen(false)
        if (action === 'add_asset') setIsAddAssetOpen(false)
        if (action === 'rename') setIsRenameDialogOpen(false)
      }
      
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed")
    } finally {
      setIsProcessingAction(false)
    }
  }

  const handleDelete = async (groupId: string) => {
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${groupId}?token=${encodeURIComponent(adminToken)}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to delete asset group")
      
      toast.success("Asset group deleted successfully")
      setAssetGroupToDelete(null)
      if (selectedAssetGroupId === groupId) {
        clearSelections()
      }
      
      // Optimistic update
      const index = business.business_asset_groups?.data?.findIndex(g => g.id === groupId)
      if (index !== undefined && index > -1 && business.business_asset_groups?.data) {
        business.business_asset_groups.data.splice(index, 1)
      }
      
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete asset group")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DetailContainer
      isOpen={!!selectedId}
      onClose={clearSelections}
      detailContent={
        selectedItem ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border/50 bg-muted/20 flex items-center justify-center p-0">
                  {selectedAssetGroupId ? <Layers className="w-8 h-8 text-primary/40" /> :
                    selectedPixelId ? <Zap className="w-8 h-8 text-primary/40" /> :
                      <MessageSquare className="w-8 h-8 text-primary/40" />}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-medium tracking-tight flex items-center gap-2">
                      {selectedItem.name || selectedItem.id}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="text-[10px] font-normal h-5 border-primary/20 bg-primary/5 text-primary capitalize">
                        Owned
                      </Badge>
                    </div>
                  </div>
                  <div 
                    onClick={copyId}
                    className="text-[10px] text-muted-foreground font-mono hover:text-primary hover:bg-primary/5 px-1.5 py-0.5 rounded -ml-1.5 w-fit transition-colors cursor-pointer group/id flex items-center gap-1.5"
                    title="Click to copy ID"
                  >
                    <Fingerprint className="w-3 h-3 text-muted-foreground/50 group-hover/id:text-primary/70 transition-colors" />
                    ID: {selectedItem.id}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  if (type === "Asset Group" && selectedAssetGroupId) {
                    setAssetGroupToDelete(selectedAssetGroupId)
                  } else {
                    toast.info(`Deleting ${type} is not supported yet`)
                  }
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors group cursor-pointer mr-10" 
                title={`Delete ${type}`}
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Management Tasks
              </h4>
              <div className="grid gap-2">
                {(type === "Asset Group" ? [
                  { 
                    label: `Rename Asset Group`, 
                    description: `Change the name of this asset group`, 
                    icon: Pencil,
                    action: () => {
                      setNewName(selectedItem?.name || "")
                      setIsRenameDialogOpen(true)
                    }
                  },
                  { 
                    label: "Assign People", 
                    description: "Grant people access to assets in this group", 
                    icon: Users,
                    action: () => setIsAssignUserOpen(true)
                  },
                  { 
                    label: "Add Assets", 
                    description: "Add more assets to this group", 
                    icon: Plus,
                    action: () => setIsAddAssetOpen(true)
                  }
                ] : [
                  { label: "Assign Partners", description: "Share this asset with other businesses", icon: Globe, action: () => toast.info("Partner assignment coming soon") },
                  { label: "Manage Permissions", description: "Control who can access this asset", icon: Users, action: () => toast.info("Permission management coming soon") }
                ]).map((task, i) => (
                  <button 
                    key={i} 
                    onClick={() => task.action?.()}
                    className="p-3 w-full text-left rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/5">
                        <task.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium">{task.label.charAt(0).toUpperCase() + task.label.slice(1).toLowerCase()}</p>
                        <p className="text-[10px] text-muted-foreground">{task.description.charAt(0).toUpperCase() + task.description.slice(1).toLowerCase()}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {selectedAssetGroupId && (
              <>
                <div className="space-y-4 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="w-3 h-3" />
                      People {assetGroupDetails?.assigned_users?.data?.length ? `(${assetGroupDetails.assigned_users.data.length})` : ''}
                      {isLoadingUsers && <Loader2 className="w-3 h-3 animate-spin text-primary/40 shrink-0" />}
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 hover:text-primary cursor-pointer"
                      onClick={() => setIsAssignUserOpen(true)}
                    >
                      <Plus className="w-3 h-3" /> Assign
                    </Button>
                  </div>
                  
                  {isLoadingUsers && !assetGroupDetails?.assigned_users?.data?.length ? (
                    <div className="flex flex-col items-center py-4 gap-2 opacity-50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  ) : assetGroupDetails?.assigned_users?.data?.length ? (
                    <div className="grid gap-1.5">
                      {assetGroupDetails.assigned_users.data.map((user) => (
                        <div key={user.id} className="flex flex-col rounded-lg bg-muted/30 border border-border/30 overflow-hidden">
                          <div 
                            onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                            className="flex items-start justify-between p-3 group gap-4 cursor-pointer hover:bg-primary/5 transition-colors"
                          >
                            <div className="flex items-start gap-3 overflow-hidden flex-1">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                                {(user.name || user.id || 'U').charAt(0)}
                              </div>
                              <div className="flex flex-col min-w-0 space-y-0.5 flex-1 mt-0.5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className="text-[11px] font-semibold truncate leading-tight group-hover:text-primary transition-colors">
                                    {user.name}
                                  </span>
                                  {(user.name?.startsWith('EM -') || user.name?.startsWith('AD -')) && (
                                    <Badge variant="outline" className="text-[8px] h-3.5 px-1 bg-transparent text-green-600 border-green-500/20 font-medium shrink-0">
                                      System user
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[9px] text-muted-foreground font-mono opacity-70">
                                  ID: {user.id}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAction('remove_user', { userId: user.id })
                                }}
                                disabled={isProcessingAction}
                                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-red-500/40 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-30 shrink-0 cursor-pointer"
                                title="Remove user from group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {expandedUserId === user.id ? (
                                <ChevronRight className="w-3.5 h-3.5 text-primary rotate-90 transition-transform" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                              )}
                            </div>
                          </div>
                          
                          {expandedUserId === user.id && (
                            <div className="px-3 pb-3 pt-1 border-t border-border/20 bg-primary/[0.02] space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="grid gap-2.5 pt-2">
                                {((user.page_roles && user.page_roles.length > 0) || (user.page_tasks && user.page_tasks.length > 0)) && (
                                  <div className="flex flex-col gap-2.5 p-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-primary/70 capitalize tracking-wide">
                                        Page permissions ({ (user.page_roles?.length || 0) + (user.page_tasks?.length || 0) })
                                      </span>
                                    </div>
                                    {user.page_roles && user.page_roles.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {user.page_roles.map(r => (
                                          <Badge key={r} variant="secondary" className="text-[8px] h-4 px-1.5 bg-primary/5 text-muted-foreground border-primary/5">
                                            {r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}

                                    {user.page_tasks && user.page_tasks.length > 0 && (
                                      <div className={`${user.page_roles && user.page_roles.length > 0 ? 'pt-1.5 border-t border-primary/5' : ''}`}>
                                        <div className="grid grid-cols-2 gap-1.5">
                                          {user.page_tasks.map(task => {
                                            const taskMap: Record<string, { label: string, color: string, desc: string }> = {
                                              'CREATE_CONTENT': { label: 'Create content', color: 'bg-blue-500/5 text-blue-600 border-blue-500/10', desc: 'Manage posts' },
                                              'MESSAGING': { label: 'Messaging', color: 'bg-indigo-500/5 text-indigo-600 border-indigo-500/10', desc: 'Reply to customers' },
                                              'MODERATE': { label: 'Moderation', color: 'bg-purple-500/5 text-purple-600 border-purple-500/10', desc: 'Manage comments' },
                                              'ADVERTISE': { label: 'Advertising', color: 'bg-orange-500/5 text-orange-600 border-orange-500/10', desc: 'Manage campaigns' },
                                              'ANALYZE': { label: 'Analytics', color: 'bg-emerald-500/5 text-emerald-600 border-emerald-500/10', desc: 'View performance' },
                                              'VIEW_MONETIZATION_INSIGHTS': { label: 'Revenue', color: 'bg-amber-500/5 text-amber-600 border-amber-500/10', desc: 'View earnings' },
                                              'MANAGE': { label: 'Full control', color: 'bg-red-500/5 text-red-600 border-red-500/10', desc: 'Complete page control' }
                                            };
                                            const t = taskMap[task] || { label: task.replace(/_/g, ' ').toLowerCase(), color: 'bg-muted text-muted-foreground border-border/30', desc: 'Additional task' };
                                            return (
                                              <div key={task} className={`flex flex-col gap-0.5 px-2 py-1 rounded-md border transition-all ${t.color}`}>
                                                <span className="text-[9px] font-bold leading-tight">{t.label}</span>
                                                <span className="text-[7.5px] opacity-70 truncate">{t.desc}</span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {user.adaccount_roles && user.adaccount_roles.length > 0 && (
                                  <div className="flex flex-col gap-2 p-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-orange-600/70 capitalize tracking-wide">
                                        Ad account permissions ({ user.adaccount_roles?.length || 0 })
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {user.adaccount_roles.map(r => (
                                        <Badge key={r} variant="secondary" className="text-[8px] h-4 px-1.5 bg-orange-500/5 text-muted-foreground border-orange-500/5">
                                          {r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {user.pixel_roles && user.pixel_roles.length > 0 && (
                                  <div className="flex flex-col gap-2 p-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-indigo-600/70 capitalize tracking-wide">
                                        Pixel permissions ({ user.pixel_roles?.length || 0 })
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {user.pixel_roles.map(r => (
                                        <Badge key={r} variant="secondary" className="text-[8px] h-4 px-1.5 bg-indigo-500/5 text-muted-foreground border-indigo-500/5">
                                          {r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {user.app_roles && user.app_roles.length > 0 && (
                                  <div className="flex flex-col gap-2 p-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-blue-600/70 capitalize tracking-wide">
                                        App permissions ({ user.app_roles?.length || 0 })
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {user.app_roles.map(r => (
                                        <Badge key={r} variant="secondary" className="text-[8px] h-4 px-1.5 bg-blue-500/5 text-muted-foreground border-blue-500/5">
                                          {r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {user.instagram_roles && user.instagram_roles.length > 0 && (
                                  <div className="flex flex-col gap-2 p-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-pink-600/70 capitalize tracking-wide">
                                        Instagram permissions ({ user.instagram_roles?.length || 0 })
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {user.instagram_roles.map(r => (
                                        <Badge key={r} variant="secondary" className="text-[8px] h-4 px-1.5 bg-pink-500/5 text-muted-foreground border-pink-500/5">
                                          {r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {user.offline_conversion_data_set_roles && user.offline_conversion_data_set_roles.length > 0 && (
                                  <div className="flex flex-col gap-2 p-0">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[9px] font-bold text-emerald-600/70 capitalize tracking-wide">
                                        Offline data permissions ({ user.offline_conversion_data_set_roles?.length || 0 })
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {user.offline_conversion_data_set_roles.map(r => (
                                        <Badge key={r} variant="secondary" className="text-[8px] h-4 px-1.5 bg-emerald-500/5 text-muted-foreground border-emerald-500/5">
                                          {r.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {!(
                                  (user.page_roles && user.page_roles.length > 0) || 
                                  (user.page_tasks && user.page_tasks.length > 0) ||
                                  (user.adaccount_roles && user.adaccount_roles.length > 0) ||
                                  (user.pixel_roles && user.pixel_roles.length > 0) ||
                                  (user.app_roles && user.app_roles.length > 0) ||
                                  (user.instagram_roles && user.instagram_roles.length > 0) ||
                                  (user.offline_conversion_data_set_roles && user.offline_conversion_data_set_roles.length > 0)
                                ) && (
                                  <div className="flex flex-col items-center justify-center py-4 px-2 bg-muted/10 rounded border border-dashed border-border/40">
                                    <span className="text-[10px] text-muted-foreground font-medium italic">No permissions assigned to this user</span>
                                    <span className="text-[8px] text-muted-foreground/50 mt-1 text-center">Assign assets to the group first, then edit the user&apos;s permissions in Business Manager.</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground italic text-center py-2">No people assigned to this group</p>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-border/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <Layers className="w-3 h-3" />
                      Assets {assetBreakdown ? `(${assetBreakdown})` : ''}
                      {isLoadingAssets && <Loader2 className="w-3 h-3 animate-spin text-primary/40 shrink-0" />}
                    </h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 hover:text-primary cursor-pointer"
                      onClick={() => setIsAddAssetOpen(true)}
                    >
                      <Plus className="w-3 h-3" /> Add Assets
                    </Button>
                  </div>

                  {isLoadingAssets && !totalAssetsCount ? (
                    <div className="flex flex-col items-center py-4 gap-2 opacity-50">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {[
                        { title: 'Pages', data: assetGroupDetails?.contained_pages?.data, icon: Globe, type: 'PAGE' },
                        { title: 'Ad Accounts', data: assetGroupDetails?.contained_ad_accounts?.data, icon: Zap, type: 'AD_ACCOUNT' },
                        { title: 'Pixels', data: assetGroupDetails?.contained_ads_pixels?.data, icon: Fingerprint, type: 'ADS_PIXEL' },
                        { title: 'Instagram', data: assetGroupDetails?.contained_instagram_accounts?.data, icon: Instagram, type: 'INSTAGRAM_ACCOUNT' },
                        { title: 'Apps', data: assetGroupDetails?.contained_applications?.data, icon: Layout, type: 'APPLICATION' },
                        { title: 'Offline Data Sets', data: assetGroupDetails?.contained_offline_conversion_data_sets?.data, icon: Database, type: 'OFFLINE_CONVERSION_DATA_SET' }
                      ].map((cat) => cat.data?.length ? (
                        <div key={cat.title} className="space-y-1.5">
                          <p className="text-[9px] font-bold text-muted-foreground tracking-wide pl-1 capitalize">
                            {cat.title.toLowerCase()} {cat.data?.length ? `(${cat.data.length})` : ''}
                          </p>
                          <div className="grid gap-1">
                            {cat.data.map((asset: { id: string; name?: string; username?: string }) => (
                              <div 
                                key={asset.id} 
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/30 group hover:border-primary/20 hover:bg-muted/40 transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <cat.icon className="w-4 h-4 text-primary/70" />
                                  </div>
                                  <div className="flex flex-col gap-0.5 overflow-hidden">
                                    <span className="text-[10px] font-medium truncate">{asset.name || asset.username || asset.id}</span>
                                    <span className="text-[9px] text-muted-foreground font-mono">ID: {asset.id}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                                  {cat.type !== 'APPLICATION' && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleAction('remove_asset', { assetId: asset.id, type: cat.type })
                                      }}
                                      disabled={isProcessingAction}
                                      className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent hover:bg-red-500/10 text-red-500/40 hover:text-red-600 transition-colors disabled:opacity-30 shrink-0 cursor-pointer"
                                      title={`Remove ${cat.title.slice(0, -1)} from group`}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null)}
                      
                      {!assetGroupDetails?.contained_pages?.data?.length && 
                       !assetGroupDetails?.contained_ad_accounts?.data?.length && 
                       !assetGroupDetails?.contained_ads_pixels?.data?.length && 
                       !assetGroupDetails?.contained_instagram_accounts?.data?.length && 
                       !assetGroupDetails?.contained_applications?.data?.length && (
                        <p className="text-[10px] text-muted-foreground italic text-center py-2">No assets in this group</p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : null
      }
    >
      <Section title="Asset Groups" icon={Layers} count={business.business_asset_groups?.data?.length || undefined}>
        {business.business_asset_groups?.data?.map((group) => (
          <Item
            key={group.id}
            isSelected={selectedAssetGroupId === group.id}
            onClick={() => { clearSelections(); setSelectedAssetGroupId(selectedAssetGroupId === group.id ? null : group.id); }}
            label={group.name}
            value={group.id}
            isID
          />
        ))}
        {!business.business_asset_groups?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No asset groups found</p>}
      </Section>

      <Section title="Tracking Pixels" icon={Zap} count={business.adspixels?.data?.length || undefined}>
        {business.adspixels?.data?.map((pix) => (
          <Item
            key={pix.id}
            isSelected={selectedPixelId === pix.id}
            onClick={() => { clearSelections(); setSelectedPixelId(selectedPixelId === pix.id ? null : pix.id); }}
            label={pix.name}
            value={pix.id}
            isID
          />
        ))}
        {!business.adspixels?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No pixels found</p>}
      </Section>

      <Section title="WhatsApp Business" icon={MessageSquare} count={business.whatsapp_business_accounts?.data?.length || undefined}>
        {business.whatsapp_business_accounts?.data?.map((wa: { id: string; name: string; status: string }) => (
          <Item
            key={wa.id}
            isSelected={selectedWhatsAppId === wa.id}
            onClick={() => { clearSelections(); setSelectedWhatsAppId(selectedWhatsAppId === wa.id ? null : wa.id); }}
            label={wa.name}
            value={wa.id}
            status={wa.status}
            isID
          />
        ))}
        {!business.whatsapp_business_accounts?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No WhatsApp accounts found</p>}
      </Section>

      <Dialog open={isRenameDialogOpen} onOpenChange={(open) => !isRenaming && setIsRenameDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Asset Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              disabled={isRenaming}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsRenameDialogOpen(false)} disabled={isRenaming}>
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={isRenaming || !newName.trim() || newName.trim() === selectedItem?.name}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isRenaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assetGroupToDelete} onOpenChange={(open) => !open && !isDeleting && setAssetGroupToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete Asset Group</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm">
            Are you sure you want to delete the asset group <strong>{business.business_asset_groups?.data?.find(g => g.id === assetGroupToDelete)?.name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="cursor-pointer" onClick={() => setAssetGroupToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => assetGroupToDelete && handleDelete(assetGroupToDelete)} 
              disabled={isDeleting}
              className="cursor-pointer shadow-sm"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignUserOpen} onOpenChange={(open) => !isProcessingAction && setIsAssignUserOpen(open)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign People to Group</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[11px] font-medium text-muted-foreground">Select user</label>
              <div className="grid gap-1 max-h-[400px] overflow-y-auto pr-1">
                {(() => {
                  const allUsers = [
                    ...(allBusinessUsers || business.business_users?.data || []).map(u => ({ ...u, isSystem: false })),
                    ...(business.system_users || []).map(u => ({ 
                      ...u, 
                      isSystem: true, 
                      email: (u as { email?: string }).email || 'System Account' 
                    }))
                  ].filter(u => {
                    const alreadyAssigned = assetGroupDetails?.assigned_users?.data?.some(au => String(au.id) === String(u.id));
                    return !alreadyAssigned;
                  });

                  return allUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAction('add_user', { userId: user.id, role: 'ADVERTISER' })}
                      disabled={isProcessingAction}
                      className="flex flex-col p-2.5 rounded-lg border border-border/40 hover:border-primary/50 bg-card text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${user.isSystem ? 'bg-green-500/10 text-green-600' : 'bg-primary/5 text-primary'}`}>
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-xs font-medium truncate">{user.name}</p>
                              {user.isSystem ? (
                                <Badge variant="outline" className="text-[7px] h-3 px-1 bg-transparent text-green-600 border-green-500/20 font-medium shrink-0">
                                  System User
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[7px] h-3 px-1 bg-transparent text-blue-600 border-blue-500/20 font-medium shrink-0">
                                  Account User
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </div>
                    </button>
                  ));
                })()}
                {!(
                  (business.business_users?.data?.length || 0) + 
                  (business.system_users?.length || 0)
                ) && (
                  <p className="text-xs text-muted-foreground italic text-center py-4">No team members available</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setIsAssignUserOpen(false)} disabled={isProcessingAction}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddAssetOpen} onOpenChange={(open) => {
        if (!isProcessingAction) {
          setIsAddAssetOpen(open)
          if (!open) setAssetSearchQuery("")
        }
      }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Assets to Group</DialogTitle>
          </DialogHeader>
          <div className="px-5 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
              <Input
                placeholder="Search by name, username or ID..."
                className="pl-10 h-10 text-xs bg-muted/30 border-border/40 focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                value={assetSearchQuery}
                onChange={(e) => setAssetSearchQuery(e.target.value)}
                autoFocus
              />
              {assetSearchQuery && (
                <button
                  onClick={() => setAssetSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
                >
                  <SearchX className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div className="py-2 space-y-6 max-h-[450px] overflow-y-auto custom-scrollbar px-5">
            {[
              { 
                title: 'Pages', 
                items: business.pages
                  ?.filter(p => !assetGroupDetails?.contained_pages?.data?.some(cp => cp.id === p.id))
                  ?.filter(p => (p.name || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) || p.id.includes(assetSearchQuery)),
                icon: Globe,
                type: 'PAGE'
              },
              { 
                title: 'Ad Accounts', 
                items: business.owned_ad_accounts?.data
                  ?.filter(a => !assetGroupDetails?.contained_ad_accounts?.data?.some(ca => ca.id === a.id))
                  ?.filter(a => (a.name || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) || a.id.includes(assetSearchQuery)),
                icon: Zap,
                type: 'AD_ACCOUNT'
              },
              { 
                title: 'Pixels', 
                items: business.adspixels?.data
                  ?.filter(p => !assetGroupDetails?.contained_ads_pixels?.data?.some(cp => cp.id === p.id))
                  ?.filter(p => (p.name || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) || p.id.includes(assetSearchQuery)),
                icon: Fingerprint,
                type: 'ADS_PIXEL'
              },
              {
                title: 'Instagram',
                items: business.instagram_accounts?.data
                  ?.filter(i => !assetGroupDetails?.contained_instagram_accounts?.data?.some(ci => ci.id === i.id))
                  ?.filter(i => (i.name || i.username || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) || i.id.includes(assetSearchQuery)),
                icon: Instagram,
                type: 'INSTAGRAM_ACCOUNT'
              },
              { 
                title: 'Apps', 
                items: business.apps
                  ?.filter(a => !assetGroupDetails?.contained_applications?.data?.some(ca => ca.id === a.id))
                  ?.filter(a => (a.name || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) || a.id.includes(assetSearchQuery)),
                icon: Layout,
                type: 'APPLICATION'
              },
              {
                title: 'Offline Data Sets',
                items: business.offline_conversion_data_sets?.data
                  ?.filter((o: { id: string; name?: string }) => !assetGroupDetails?.contained_offline_conversion_data_sets?.data?.some(co => co.id === o.id))
                  ?.filter((o: { id: string; name?: string }) => (o.name || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) || o.id.includes(assetSearchQuery)),
                icon: Fingerprint,
                type: 'OFFLINE_CONVERSION_DATA_SET'
              }
            ].map((section) => section.items?.length ? (
              <div key={section.title} className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wide flex items-center gap-2 capitalize">
                  <section.icon className="w-3 h-3" />
                  {section.title} {section.items.length > 0 && `(${section.items.length})`}
                </label>
                <div className="grid gap-1">
                  {section.items.map((item: { id: string; name?: string; username?: string }) => (
                    <button
                      key={item.id}
                      onClick={() => handleAction('add_asset', { assetId: item.id, type: section.type })}
                      disabled={isProcessingAction}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 hover:border-primary/50 bg-card text-left transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <section.icon className="w-4 h-4 text-primary/70" />
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <span className="text-xs font-medium truncate max-w-[250px]">{item.name || item.username}</span>
                          <span className="text-[9px] text-muted-foreground font-mono">ID: {item.id}</span>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null)}

            {assetSearchQuery && ![
              business.pages?.filter(p => !assetGroupDetails?.contained_pages?.data?.some(cp => cp.id === p.id)),
              business.owned_ad_accounts?.data?.filter(a => !assetGroupDetails?.contained_ad_accounts?.data?.some(ca => ca.id === a.id)),
              business.adspixels?.data?.filter(p => !assetGroupDetails?.contained_ads_pixels?.data?.some(cp => cp.id === p.id)),
              business.instagram_accounts?.data?.filter(i => !assetGroupDetails?.contained_instagram_accounts?.data?.some(ci => ci.id === i.id)),
              business.apps?.filter(a => !assetGroupDetails?.contained_applications?.data?.some(ca => ca.id === a.id)),
              business.offline_conversion_data_sets?.data?.filter((o: { id: string; name?: string }) => !assetGroupDetails?.contained_offline_conversion_data_sets?.data?.some(co => co.id === o.id))
            ].some(list => list?.some(item => ((item as { name?: string }).name || (item as { username?: string }).username || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) || item.id.includes(assetSearchQuery))) && (
              <p className="text-center text-[11px] text-muted-foreground italic py-8">
                No matching assets found for &ldquo;{assetSearchQuery}&rdquo;
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => setIsAddAssetOpen(false)} disabled={isProcessingAction}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailContainer>
  )
}

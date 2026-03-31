"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { 
  Smartphone, 
  Users, 
  Fingerprint, 
  ExternalLink, 
  ChevronRight, 
  Zap, 
  Clock, 
  LogOut, 
  Layers, 
  ShieldCheck,
  Globe,
  KeyRound,
  Database,
  Boxes,
  Handshake,
  Package,
  Plus,
  Trash2,
  Loader2
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow, SystemUser } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { AssignAppUserDialog } from "./AssignAppUserDialog"

interface ApplicationsTabProps {
  business: BusinessRow
  adminToken: string
  systemUsers: SystemUser[]
  onRecrawl?: () => void
}

export const ApplicationsTab = ({ business, adminToken, systemUsers, onRecrawl }: ApplicationsTabProps) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [appToDelete, setAppToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const router = useRouter()
  const [appUsers, setAppUsers] = useState<{ id: string; name: string; tasks?: string[] }[]>([])
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [isAssignUserOpen, setIsAssignUserOpen] = useState(false)
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false)
  const [isProcessingAction, setIsProcessingAction] = useState(false)

  const selectedApp = business.apps?.find(a => a.id === selectedAppId)
  const isReadOnly = selectedApp?.source === "asset_group"

  const fetchAppUsers = useCallback(async (appId: string) => {
    setIsLoadingDetails(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/apps/${appId}/users?token=${encodeURIComponent(adminToken)}`)
      const data = await res.json()
      if (data.success) {
        setAppUsers(data.data || [])
      } else {
        setAppUsers([])
      }
    } catch (err) {
      console.error("[ApplicationsTab] Failed to fetch app users:", err)
      setAppUsers([])
    } finally {
      setIsLoadingDetails(false)
    }
  }, [business.id, adminToken])

  useEffect(() => {
    if (selectedAppId) {
      fetchAppUsers(selectedAppId)
    } else {
      setAppUsers([])
    }
  }, [selectedAppId, fetchAppUsers])

  const stats = [
    { label: 'Active Users', value: selectedApp?.daily_active_users || 0, icon: Users },
    { label: 'Weekly Active', value: selectedApp?.weekly_active_users || 0, icon: Clock },
    { label: 'Monthly Active', value: selectedApp?.monthly_active_users || 0, icon: Globe },
  ]
  const hasStats = stats.some(s => s.value !== 0)

  const sortApps = (apps: Array<{ id: string; name: string; category?: string; source?: string; icon_url?: string }>) => [...apps].sort((a, b) => a.name.localeCompare(b.name))
  const ownedApps = sortApps(business.apps?.filter(a => a.source === 'owned') || [])
  const sharingApps = sortApps(business.apps?.filter(a => a.source === 'client') || [])
  const pendingApps = sortApps(business.apps?.filter(a => a.source === 'pending') || [])
  const assetGroupApps = sortApps(business.apps?.filter(a => a.source === 'asset_group') || [])

  const getTokenCountForApp = useCallback((appName: string) => {
    return systemUsers.filter(su =>
      su.appName?.trim().toLowerCase() === appName?.trim().toLowerCase() &&
      (su.businessId || "").trim() === (business.id || "").trim()
    ).length
  }, [systemUsers, business.id])

  const handleRemoveAppFromGroup = async (groupId: string) => {
    if (isProcessingAction) return
    setIsProcessingAction(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${groupId}?token=${encodeURIComponent(adminToken)}&action=remove_asset&assetId=${selectedAppId}&type=APPLICATION`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Removed app from group")
        onRecrawl?.()
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove")
    } finally {
      setIsProcessingAction(false)
    }
  }

  return (
    <>
      <DetailContainer
        isOpen={!!selectedAppId}
        onClose={() => setSelectedAppId(null)}
        detailContent={
          selectedApp ? (
            <div className="space-y-8">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border/50 bg-muted/20 flex items-center justify-center p-0 shrink-0">
                    {selectedApp.icon_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={selectedApp.icon_url} alt={selectedApp.name} className="w-full h-full object-cover" />
                    ) : (
                      <Smartphone className="w-8 h-8 text-primary/40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-lg font-medium tracking-tight flex items-center gap-2 truncate">
                        {selectedApp.name}
                        {selectedApp.link && (
                          <a href={selectedApp.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </h3>
                      <div className="flex items-center gap-2 pt-0.5">
                        <Badge variant="outline" className={cn(
                          "text-[10px] font-normal h-5 border-primary/20",
                          isReadOnly ? "bg-purple-50 text-purple-600 border-purple-100" : "bg-primary/5 text-primary"
                        )}>
                          {isReadOnly ? "Asset Group App" : "Business App"}
                        </Badge>
                        {selectedApp.source && (
                          <Badge variant="secondary" className="text-[10px] font-normal h-5 capitalize">
                            Source: {selectedApp.source.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div
                      onClick={() => {
                        navigator.clipboard.writeText(selectedApp.id);
                        toast.success("ID Copied");
                      }}
                      className="text-[10px] text-muted-foreground font-mono hover:text-primary hover:bg-primary/5 px-1.5 py-0.5 rounded -ml-1.5 w-fit transition-colors cursor-pointer group/id flex items-center gap-1.5"
                    >
                      <Fingerprint className="w-3 h-3 text-muted-foreground/50 group-hover/id:text-primary/70" />
                      ID: {selectedApp.id}
                    </div>
                  </div>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAppToDelete(selectedApp.id);
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors group cursor-pointer"
                    title="Remove Application"
                  >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </button>
                )}
              </div>

              {isReadOnly && (
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Read-Only Asset</span>
                  </div>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    This app is shared with you via an <strong>Asset Group</strong>. Administrative actions such as user assignments must be performed by the Business Manager that owns the asset group.
                  </p>
                </div>
              )}

              <div className={cn("space-y-8", isReadOnly && "opacity-60 pointer-events-none grayscale-[0.5]")}>
                {hasStats && (
                  <div className="grid grid-cols-3 gap-3">
                    {stats.map((stat, i) => (
                      <div key={i} className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          <stat.icon className="w-3 h-3" />
                          {stat.label.split(' ')[0]}
                        </div>
                        <div className="text-lg font-semibold tracking-tight">
                          {typeof stat.value === 'number' ? stat.value.toLocaleString() : Number(stat.value || 0).toLocaleString()}
                        </div>
                        <div className="text-[9px] text-muted-foreground">{stat.label.split(' ').slice(1).join(' ')}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    Management Tasks
                  </h4>
                  <div className="grid gap-2">
                    {[
                      { label: "Open Dashboard", description: "Go to Developers console", icon: ExternalLink, href: selectedApp.link || `https://developers.facebook.com/apps/${selectedApp.id}` },
                      { label: "Assign People", description: "Grant people access", icon: Users, action: () => setIsAssignUserOpen(true) },
                      { label: "Add to Group", description: "Add to asset group", icon: Layers, action: () => setIsAddGroupOpen(true) }
                    ].map((task, i) => (
                      task.href ? (
                        <a key={i} href={task.href} target="_blank" rel="noreferrer" className="p-3 rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer">
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
                        </a>
                      ) : (
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
                      )
                    ))}
                  </div>
                </div>

                {/* People & Asset Groups Block */}
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="w-3 h-3" />
                        People {appUsers.length > 0 ? `(${appUsers.length})` : ""}
                      </h4>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => setIsAssignUserOpen(true)}>
                        <Plus className="w-3 h-3" /> Assign
                      </Button>
                    </div>
                    {isLoadingDetails ? (
                      <div className="py-8 flex flex-col items-center gap-2 opacity-50"><Loader2 className="w-5 h-5 animate-spin text-primary" /><span className="text-[10px]">Loading people...</span></div>
                    ) : appUsers.length > 0 ? (
                      <div className="grid gap-1.5">
                        {appUsers.map((user) => (
                          <div key={user.id} className="flex flex-col rounded-lg bg-muted/30 border border-border/30 overflow-hidden">
                            <div onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)} className="flex items-center justify-between p-3 group cursor-pointer hover:bg-primary/5">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{(user.name || 'U').charAt(0)}</div>
                                <div className="flex flex-col min-w-0"><span className="text-[11px] font-semibold truncate group-hover:text-primary">{user.name}</span><span className="text-[9px] text-muted-foreground font-mono">ID: {user.id}</span></div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={async (e) => { e.stopPropagation(); if (isProcessingAction) return; setIsProcessingAction(true); try { const res = await fetch(`/api/facebook/business/${business.id}/apps/${selectedAppId}/users?userId=${user.id}&token=${encodeURIComponent(adminToken)}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { toast.success("User unassigned"); fetchAppUsers(selectedAppId!); } else throw new Error(data.error); } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); } finally { setIsProcessingAction(false); } }} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-red-500/40 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                <ChevronRight className={cn("w-3.5 h-3.5 text-muted-foreground/20 transition-all", expandedUserId === user.id && "rotate-90 text-primary")} />
                              </div>
                            </div>
                            {expandedUserId === user.id && user.tasks && (
                              <div className="px-3 pb-3 pt-1 border-t border-border/20 bg-primary/[0.02] animate-in fade-in slide-in-from-top-1">
                                <span className="text-[9px] font-bold text-primary/70 mb-2 block">App Tasks</span>
                                <div className="flex flex-wrap gap-1">
                                  {user.tasks.map(t => <Badge key={t} variant="secondary" className="text-[8px] h-4 bg-primary/5 text-muted-foreground">{t.replace(/_/g, ' ').toLowerCase()}</Badge>)}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[10px] text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">No people assigned</p>}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                        <Layers className="w-3 h-3" />
                        Asset Groups {(() => {
                          const count = business.business_asset_groups?.data?.filter(g =>
                            g.contained_applications?.data?.some((app: { id: string }) => String(app.id) === String(selectedAppId))
                          ).length || 0
                          return count > 0 ? `(${count})` : ""
                        })()}
                      </h4>
                      <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => setIsAddGroupOpen(true)}>
                        <Plus className="w-3 h-3" /> Add to Group
                      </Button>
                    </div>
                    {(() => {
                      const groupsWithApp = business.business_asset_groups?.data?.filter(g =>
                        g.contained_applications?.data?.some((app: { id: string }) => String(app.id) === String(selectedAppId))
                      ) || []
                      return groupsWithApp.length > 0 ? (
                        <div className="grid gap-1.5">
                          {groupsWithApp.map((group) => (
                            <div key={group.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30 group hover:border-primary/20 hover:bg-muted/40 transition-all cursor-pointer">
                              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0"><Layers className="w-4 h-4 text-purple-600" /></div>
                                <div className="flex flex-col min-w-0"><span className="text-[11px] font-medium truncate group-hover:text-primary">{group.name}</span><span className="text-[9px] text-muted-foreground font-mono">ID: {group.id}</span></div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveAppFromGroup(group.id); }} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-red-500/40 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary transition-colors" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-[10px] text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">No asset groups contain this app</p>
                    })()}
                  </div>
                </div>

                {/* Tokens Block */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    {(() => {
                      const localUsers = systemUsers.filter(su => su.appName?.trim().toLowerCase() === selectedApp.name?.trim().toLowerCase() && (su.businessId || "").trim() === (business.id || "").trim())
                      return (
                        <>
                          <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <KeyRound className="w-3 h-3" />
                            Assigned Tokens {localUsers.length > 0 ? `(${localUsers.length})` : ""}
                          </h4>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 text-muted-foreground hover:text-primary cursor-pointer" onClick={() => toast.info("New assignment via Local DB")}>
                            <Plus className="w-3 h-3" /> Add Token
                          </Button>
                        </>
                      )
                    })()}
                  </div>
                  {(() => {
                    const localUsers = systemUsers.filter(su => su.appName?.trim().toLowerCase() === selectedApp.name?.trim().toLowerCase() && (su.businessId || "").trim() === (business.id || "").trim())
                    return localUsers.length > 0 ? (
                      <div className="grid gap-1.5">
                        {localUsers.map((su) => (
                          <div key={su.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/[0.03] border border-orange-500/10 group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0"><Database className="w-4 h-4" /></div>
                              <div className="flex flex-col"><span className="text-[11px] font-semibold">{su.name}</span><span className="text-[9px] text-muted-foreground font-mono">ID: {su.id}</span></div>
                            </div>
                            <Badge variant="outline" className={cn("text-[8px] h-3.5", su.status === 'Active' ? "bg-green-50 text-green-600 border-green-200" : su.status === 'Disabled' ? "bg-red-50 text-red-600 border-red-200" : "bg-muted text-muted-foreground")}>{su.status || 'Inactive'}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[10px] text-muted-foreground italic text-center py-4 border border-dashed rounded-lg">No local tokens assigned</p>
                  })()}
                </div>
              </div>
            </div>
          ) : null
        }
      >
        <div className="space-y-6">
          <Section title="Owned Applications" icon={Boxes} count={ownedApps.length > 0 ? ownedApps.length : undefined}>
            {ownedApps.map(app => (
              <Item key={app.id} isSelected={selectedAppId === app.id} onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)} label={app.name} value={app.id} subValue={app.category} extraSubValue={getTokenCountForApp(app.name) > 0 ? `${getTokenCountForApp(app.name)} tokens` : undefined} isID imageUrl={app.icon_url} />
            ))}
            {ownedApps.length === 0 && <p className="text-xs text-muted-foreground italic pl-2">No owned applications</p>}
          </Section>

          {sharingApps.length > 0 && (
            <Section title="Client Applications" icon={Handshake} count={sharingApps.length > 0 ? sharingApps.length : undefined}>
              {sharingApps.map(app => (
                <Item key={app.id} isSelected={selectedAppId === app.id} onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)} label={app.name} value={app.id} subValue={app.category} extraSubValue={getTokenCountForApp(app.name) > 0 ? `${getTokenCountForApp(app.name)} tokens` : undefined} isID imageUrl={app.icon_url} />
              ))}
            </Section>
          )}

          {pendingApps.length > 0 && (
            <Section title="Pending Requests" icon={Clock} count={pendingApps.length > 0 ? pendingApps.length : undefined}>
              {pendingApps.map(app => (
                <Item key={app.id} isSelected={selectedAppId === app.id} onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)} label={app.name} value={app.id} subValue={app.category} isID imageUrl={app.icon_url} />
              ))}
            </Section>
          )}

          {assetGroupApps.length > 0 && (
            <Section title="Asset Group Applications" icon={Package} count={assetGroupApps.length > 0 ? assetGroupApps.length : undefined}>
              <div className="mb-2 px-2 py-1.5 rounded-md bg-muted/30 border border-border/50">
                <p className="text-[10px] text-muted-foreground leading-snug">Shared via Asset Groups. Read-only access.</p>
              </div>
              {assetGroupApps.map(app => (
                <Item key={app.id} isSelected={selectedAppId === app.id} onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)} label={app.name} value={app.id} subValue={app.category} extraSubValue={getTokenCountForApp(app.name) > 0 ? `${getTokenCountForApp(app.name)} tokens` : undefined} isID imageUrl={app.icon_url} />
              ))}
            </Section>
          )}

          {!business.apps?.length && <p className="text-xs text-muted-foreground italic pl-2">No applications found</p>}
        </div>
      </DetailContainer>

      {appToDelete && (
        <Dialog open={!!appToDelete} onOpenChange={(open) => !open && !isDeleting && setAppToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Application?</DialogTitle>
              <DialogDescription>Are you sure you want to remove this application from the Business Manager?</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAppToDelete(null)} disabled={isDeleting} className="cursor-pointer">Cancel</Button>
              <Button variant="destructive" onClick={async () => {
                setIsDeleting(true)
                try {
                  const res = await fetch(`/api/facebook/business/${business.id}/apps?token=${encodeURIComponent(adminToken)}&appId=${appToDelete}`, { method: "DELETE" })
                  const data = await res.json()
                  if (data.success) {
                    toast.success("Application removed")
                    setAppToDelete(null)
                    setSelectedAppId(null)
                    router.refresh()
                  } else throw new Error(data.error)
                } catch (err) { toast.error(err instanceof Error ? err.message : "Failed") }
                finally { setIsDeleting(false) }
              }} disabled={isDeleting} className="cursor-pointer text-white">{isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Remove Application</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {selectedAppId && (
        <>
          <AssignAppUserDialog
            business={business}
            appId={selectedAppId}
            appName={selectedApp?.name || "App"}
            adminToken={adminToken}
            isOpen={isAssignUserOpen}
            onSuccess={() => fetchAppUsers(selectedAppId)}
            onClose={() => setIsAssignUserOpen(false)}
            existingUserIds={appUsers.map(u => u.id)}
          />

          <Dialog open={isAddGroupOpen} onOpenChange={setIsAddGroupOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add to Asset Group</DialogTitle>
                <DialogDescription>Select an asset group to add the application <strong>{selectedApp?.name}</strong>.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-2 py-4">
                {(() => {
                  const availableGroups = business.business_asset_groups?.data?.filter(g =>
                    !g.contained_applications?.data?.some((app: { id: string }) => String(app.id) === String(selectedAppId))
                  ) || []

                  return availableGroups.length > 0 ? availableGroups.map(group => (
                    <button
                      key={group.id}
                      onClick={async () => {
                        if (isProcessingAction) return
                        setIsProcessingAction(true)
                        try {
                          const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${group.id}?token=${encodeURIComponent(adminToken)}`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              action: "add_asset",
                              assetId: selectedAppId,
                              type: "APPLICATION"
                            })
                          })
                          if (res.ok) {
                            toast.success("Added to group");
                            setIsAddGroupOpen(false);
                            onRecrawl?.();
                          } else {
                            const data = await res.json()
                            throw new Error(data.error || "Failed to add")
                          }
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed")
                        } finally {
                          setIsProcessingAction(false)
                        }
                      }}
                      className="flex items-center gap-3 p-3 text-left rounded-lg border border-border/40 hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer shadow-sm"
                    >
                      <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-purple-600 shrink-0 shadow-sm"><Layers className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate group-hover:text-primary">{group.name}</p><p className="text-xs text-muted-foreground/60 font-mono truncate tracking-tight">{group.id}</p></div>
                      <Plus className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </button>
                  )) : <p className="text-center py-4 text-sm text-muted-foreground">No asset groups available.</p>
                })()}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  )
}

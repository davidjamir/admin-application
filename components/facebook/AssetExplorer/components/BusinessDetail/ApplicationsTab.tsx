"use client"

import React, { useState } from "react"
import { Smartphone, Users, BadgeCheck, Fingerprint, ExternalLink, Link2, Settings, ChevronRight, Zap, Boxes, Handshake, Clock, LogOut, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ApplicationsTabProps {
  business: BusinessRow
  adminToken: string
}

export const ApplicationsTab = ({ business, adminToken }: ApplicationsTabProps) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [appToDelete, setAppToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const selectedApp = business.apps?.find(a => a.id === selectedAppId)

  const handleDeleteApp = async (appId: string) => {
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/facebook/business/${business.id}/apps/${appId}?token=${encodeURIComponent(adminToken)}`, {
        method: "DELETE"
      })
      
      const data = await res.json()
      if (!res.ok || data.error) {
         toast.error(data.error || "Failed to remove app from Business")
      } else {
         toast.success("Successfully removed app")
         setSelectedAppId(null)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove app")
    } finally {
      setIsDeleting(false)
      setAppToDelete(null)
    }
  }

  const stats = selectedApp ? [
    { label: "Daily Active Users", value: selectedApp.daily_active_users || "0", icon: Users },
    { label: "Weekly Active Users", value: selectedApp.weekly_active_users || "0", icon: Users },
    { label: "Monthly Active Users", value: selectedApp.monthly_active_users || "0", icon: Users },
  ] : []

  const hasStats = stats.some(s => s.value !== "0" && s.value !== 0)

  const sortApps = <T extends { name: string }>(apps: T[]): T[] => [...apps].sort((a, b) => a.name.localeCompare(b.name))

  const ownedApps = sortApps(business.apps?.filter(a => a.source === 'owned') || [])
  const sharingApps = sortApps(business.apps?.filter(a => a.source === 'client') || [])
  const pendingApps = sortApps(business.apps?.filter(a => a.source === 'pending') || [])

  return (
    <DetailContainer
      isOpen={!!selectedAppId}
      onClose={() => setSelectedAppId(null)}
      detailContent={
        selectedApp ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border/50 bg-muted/20 flex items-center justify-center p-0">
                  {selectedApp.icon_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={selectedApp.icon_url} alt={selectedApp.name} className="w-full h-full object-cover" />
                  ) : (
                    <Smartphone className="w-8 h-8 text-primary/40" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-medium tracking-tight flex items-center gap-2">
                      {selectedApp.name}
                      {selectedApp.link && (
                        <a href={selectedApp.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="text-[10px] font-normal h-5 border-primary/20 bg-primary/5 text-primary capitalize">
                        {selectedApp.source || "App"}
                      </Badge>
                      {selectedApp.category && (
                        <Badge variant="outline" className="text-[10px] font-normal h-5 border-green-600/20 bg-green-600/5 text-green-600">
                          {selectedApp.category}
                        </Badge>
                      )}
                      {selectedApp.app_install_tracked && (
                        <Badge variant="outline" className="text-[10px] font-normal h-5 border-green-500/20 bg-green-500/5 text-green-500 flex items-center gap-1">
                          <BadgeCheck className="w-2.5 h-2.5" />
                          Tracked
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedApp.id);
                      import('sonner').then(({ toast }) => toast.success("ID Copied"));
                    }}
                    className="text-[10px] text-muted-foreground font-mono hover:text-primary hover:bg-primary/5 px-1.5 py-0.5 rounded -ml-1.5 w-fit transition-colors cursor-pointer group/id flex items-center gap-1.5"
                    title="Click to copy App ID"
                  >
                    <Fingerprint className="w-3 h-3 text-muted-foreground/50 group-hover/id:text-primary/70 transition-colors" />
                    ID: {selectedApp.id}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setAppToDelete(selectedApp.id);
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors group cursor-pointer mr-10"
                title="Gỡ ứng dụng"
              >
                <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

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
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Management Tasks
              </h4>
              <div className="grid gap-2">
                {[
                  { 
                    label: selectedApp.link?.includes('facebook.com/games') ? "View on Facebook" : "Open App Dashboard", 
                    description: selectedApp.link?.includes('facebook.com/games') ? "View this app on Facebook" : "Go to Facebook Developers console", 
                    icon: ExternalLink, 
                    href: selectedApp.link || `https://developers.facebook.com/apps/${selectedApp.id}` 
                  },
                  { label: "Assign Assets", description: "Connect Pages or Ad Accounts to this app", icon: Link2 },
                  { label: "Manage Permissions", description: "Control developer roles and tasks", icon: Fingerprint },
                  { label: "App Settings", description: "Configure basic info and security", icon: Settings }
                ].map((task, i) => (
                  task.href ? (
                    <a
                      key={i}
                      href={task.href}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center">
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
                    <div key={i} className="p-3 rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center">
                          <task.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium">{task.label}</p>
                          <p className="text-[10px] text-muted-foreground">{task.description}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        ) : null
      }
    >
      <Section 
        title="Owned Applications" 
        icon={Boxes} 
        count={ownedApps.length > 0 ? ownedApps.length : undefined}
      >
        {ownedApps.map((app) => (
          <Item
            key={app.id}
            isSelected={selectedAppId === app.id}
            onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)}
            label={app.name}
            value={app.id}
            subValue={app.category}
            isID
            imageUrl={app.icon_url}
          />
        ))}
        {ownedApps.length === 0 && <p className="text-xs text-muted-foreground italic pl-2">No owned applications</p>}
      </Section>

      <Section 
        title="Client Applications" 
        icon={Handshake} 
        count={sharingApps.length > 0 ? sharingApps.length : undefined}
      >
        {sharingApps.map((app) => (
          <Item
            key={app.id}
            isSelected={selectedAppId === app.id}
            onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)}
            label={app.name}
            value={app.id}
            subValue={app.category}
            isID
            imageUrl={app.icon_url}
          />
        ))}
        {sharingApps.length === 0 && <p className="text-xs text-muted-foreground italic pl-2">No client applications</p>}
      </Section>

      <Section 
        title="Pending Client Applications" 
        icon={Clock} 
        count={pendingApps.length > 0 ? pendingApps.length : undefined}
      >
        {pendingApps.map((app) => (
          <Item
            key={app.id}
            isSelected={selectedAppId === app.id}
            onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)}
            label={app.name}
            value={app.id}
            subValue={app.category}
            isID
            status="Pending"
            imageUrl={app.icon_url}
          />
        ))}
        {pendingApps.length === 0 && <p className="text-xs text-muted-foreground italic pl-2">No pending client applications</p>}
      </Section>

      {appToDelete && (
        <Dialog open={!!appToDelete} onOpenChange={(open) => !open && !isDeleting && setAppToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm App Removal</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-sm">
              Are you sure you want to remove the application <strong>{business.apps?.find(a => a.id === appToDelete)?.name}</strong> from this business?
            </div>
            <DialogFooter>
              <Button variant="outline" className="cursor-pointer" onClick={() => setAppToDelete(null)} disabled={isDeleting}>Cancel</Button>
              <Button variant="destructive" className="cursor-pointer" onClick={() => handleDeleteApp(appToDelete)} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                Remove App
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DetailContainer>
  )
}

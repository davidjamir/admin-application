"use client"

import React, { useState } from "react"
import { Smartphone, Users, BadgeCheck, Fingerprint, ExternalLink, Link2, Settings, ChevronRight, Zap, Boxes, Handshake, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"

interface ApplicationsTabProps {
  business: BusinessRow
}

export const ApplicationsTab = ({ business }: ApplicationsTabProps) => {
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)

  const selectedApp = business.apps?.find(a => a.id === selectedAppId)

  const stats = selectedApp ? [
    { label: "Daily Active Users", value: selectedApp.daily_active_users || "0", icon: Users },
    { label: "Weekly Active Users", value: selectedApp.weekly_active_users || "0", icon: Users },
    { label: "Monthly Active Users", value: selectedApp.monthly_active_users || "0", icon: Users },
  ] : []
  const ownedApps = business.apps?.filter(a => a.source === 'owned') || []
  const sharingApps = business.apps?.filter(a => a.source === 'sharing') || []
  const pendingApps = business.apps?.filter(a => a.source === 'pending') || []

  return (
    <DetailContainer
      isOpen={!!selectedAppId}
      onClose={() => setSelectedAppId(null)}
      detailContent={
        selectedApp ? (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border/50 bg-muted/20 flex items-center justify-center p-0">
                  {selectedApp.icon_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={selectedApp.icon_url} alt={selectedApp.name} className="w-full h-full object-cover" />
                  ) : (
                    <Smartphone className="w-8 h-8 text-primary/40" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium tracking-tight flex items-center gap-2">
                    {selectedApp.name}
                    {selectedApp.link && (
                      <a href={selectedApp.link} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px] font-normal h-5 border-primary/20 bg-primary/5 text-primary capitalize">
                      {selectedApp.source || "App"}
                    </Badge>
                    {selectedApp.category && (
                      <Badge variant="outline" className="text-[10px] font-normal h-5 border-blue-500/20 bg-blue-500/5 text-blue-500">
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
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, i) => (
                <div key={i} className="p-3 rounded-xl border border-border/40 bg-card/50 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    <stat.icon className="w-3 h-3" />
                    {stat.label.split(' ')[0]}
                  </div>
                  <div className="text-lg font-semibold tracking-tight">{Number(stat.value).toLocaleString()}</div>
                  <div className="text-[9px] text-muted-foreground">{stat.label.split(' ').slice(1).join(' ')}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Fingerprint className="w-3 h-3" />
                Application Info
              </h4>
              <div className="grid gap-3 p-4 rounded-xl border border-border/50 bg-card/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">App ID</span>
                  <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] select-all cursor-pointer hover:bg-muted/80">{selectedApp.id}</code>
                </div>
                {selectedApp.permitted_tasks && selectedApp.permitted_tasks.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-medium">Your Permissions</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.permitted_tasks.map((task: string, i: number) => (
                        <Badge key={i} variant="secondary" className="px-2 py-0 h-4 text-[9px] font-medium bg-muted/60 text-muted-foreground border-none">
                          {task.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Management Tasks
              </h4>
              <div className="grid gap-2">
                {[
                  { label: "Open App Dashboard", description: "Go to Facebook Developers console", icon: ExternalLink, href: selectedApp.link || `https://developers.facebook.com/apps/${selectedApp.id}` },
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
          />
        ))}
        {pendingApps.length === 0 && <p className="text-xs text-muted-foreground italic pl-2">No pending client applications</p>}
      </Section>
    </DetailContainer>
  )
}

"use client"

import React, { useState } from "react"
import { Users2, ShieldCheck, User, Fingerprint, Package, Flag, CreditCard, Layers, Layout, LogOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BusinessRow, SystemUser, FacebookPage } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"
import { cn } from "@/lib/utils"
import { AddSystemUserDialog } from "./AddSystemUserDialog"

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

  const filteredSystemUsers = systemUsers?.filter(u => (u.businessId || "").trim() === (business.id || "").trim()) || []
  const formatRole = (role?: string) => {
    if (!role) return ""
    return role
      .toLowerCase()
      .split(/[_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  type TeamUser = { id?: string; name?: string; email?: string; role?: string; appName?: string }
  const selectedUser = (
    selectedUserType === 'business' ? allBusinessUsers.find(u => u.id === selectedUserId) :
      selectedUserType === 'system' ? business.system_users?.find(u => u.id === selectedUserId) :
        filteredSystemUsers.find(u => u.id === selectedUserId)
  ) as TeamUser | undefined

  const isYou = selectedUserId === currentUser?.id
  const assignedPages = isYou ? (business.pages || []) : []
  
  const handleRemoveAsset = (e: React.MouseEvent, assetName: string, assetType: string) => {
    e.stopPropagation()
    toast.success(`Removed permission for ${assetType}: ${assetName}`)
  }

  return (
    <DetailContainer
      isOpen={!!selectedUserId}
      onClose={() => { setSelectedUserId(null); setSelectedUserType(null); }}
      detailContent={
        selectedUser ? (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium tracking-tight flex items-center flex-wrap gap-2">
                    {selectedUser.name}
                    {isYou && <span className="text-xs text-muted-foreground">(You)</span>}
                    <Badge variant="outline" className="text-[10px] font-normal h-5 border-primary/20 bg-primary/5 text-primary">
                      {formatRole(
                        isYou && business.permitted_roles && business.permitted_roles.length > 0
                          ? business.permitted_roles.map(r => r.toUpperCase()).join(", ")
                          : (selectedUser.role || (selectedUserType === 'system' ? 'System User' : 'Partner'))
                      )}
                    </Badge>
                  </h3>
                  
                  <div className="flex flex-col gap-1.5 mt-2.5">
                    <div 
                      className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 font-mono cursor-pointer hover:text-primary transition-colors w-fit"
                      onClick={() => {
                        if (selectedUser.id) {
                          navigator.clipboard.writeText(selectedUser.id)
                          toast.success("ID Copied")
                        }
                      }}
                      title="Click to copy ID"
                    >
                      <Fingerprint className="w-3 h-3" />
                      ID: {selectedUser.id}
                    </div>
                    {selectedUser.email && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70 italic lowercase">
                        <User className="w-3 h-3" />
                        {selectedUser.email}
                      </div>
                    )}
                    {selectedUser.appName && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                        <Package className="w-3 h-3" />
                        Application: {selectedUser.appName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-medium tracking-wider text-muted-foreground flex items-center gap-2">
                <Package className="w-3 h-3" />
                Assigned Assets
              </h4>
 
              <div className="grid gap-4">
                {assignedPages.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground px-1">Pages ({assignedPages.length})</div>
                    <div className="max-h-[450px] overflow-y-auto pr-1 space-y-0 custom-scrollbar border border-border/40 rounded-lg overflow-hidden">
                      {assignedPages.map((page: FacebookPage) => (
                        <div key={page.id} className={cn(
                          "py-1.5 px-2 bg-card flex items-center justify-between group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0"
                        )}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-5 h-5 bg-blue-50 rounded flex items-center justify-center shrink-0">
                              <Flag className="w-3 h-3 text-blue-600" />
                            </div>
                            <p className="text-xs font-medium truncate max-w-[300px]">{page.name}</p>
                          </div>
                          <div className="flex items-center gap-4 text-[9px] shrink-0">
                            <span className="text-muted-foreground tabular-nums">ID: {page.id}</span>
                            <button
                              onClick={(e) => handleRemoveAsset(e, page.name || "Unknown Page", "Page")}
                              className="p-1 border border-destructive/30 text-destructive hover:bg-red-600/10 rounded transition-all cursor-pointer shadow-sm"
                              title="Remove Permission"
                            >
                              <LogOut className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                    <Package className="w-6 h-6 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground italic">
                      {isYou ? "No assigned pages found for this identity" : "Asset visibility restricted for non-local accounts"}
                    </p>
                  </div>
                )}
 
                {isYou && business.owned_ad_accounts?.data && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground px-1">Ads Manager ({business.owned_ad_accounts.data.length})</div>
                    <div className="max-h-[500px] overflow-y-auto pr-1 space-y-0 custom-scrollbar border border-border/40 rounded-lg overflow-hidden">
                      {business.owned_ad_accounts.data.map((acc) => (
                        <div key={acc.id} className="py-1.5 px-2 bg-card flex items-center justify-between group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-5 h-5 bg-green-50 rounded flex items-center justify-center shrink-0">
                              <CreditCard className="w-3 h-3 text-green-600" />
                            </div>
                            <p className="text-xs font-medium truncate">{acc.name}</p>
                          </div>
                          <div className="flex items-center gap-4 text-[9px] shrink-0 text-muted-foreground tabular-nums">
                            <span>ID: {acc.id} • {acc.currency}</span>
                            <button
                              onClick={(e) => handleRemoveAsset(e, acc.name || "Unknown Account", "Ad Account")}
                              className="p-1 border border-destructive/30 text-destructive hover:bg-red-600/10 rounded transition-all cursor-pointer shadow-sm"
                              title="Remove Permission"
                            >
                              <LogOut className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Asset Groups */}
                {isYou && business.business_asset_groups?.data && business.business_asset_groups.data.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground px-1">Asset Groups ({business.business_asset_groups.data.length})</div>
                    <div className="max-h-[400px] overflow-y-auto pr-1 space-y-0 custom-scrollbar border border-border/40 rounded-lg overflow-hidden">
                      {business.business_asset_groups.data.map((group) => (
                        <div key={group.id} className={cn(
                          "py-1.5 px-2 bg-card flex items-center justify-between group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0"
                        )}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-5 h-5 bg-purple-50 rounded flex items-center justify-center shrink-0">
                              <Layers className="w-3 h-3 text-purple-600" />
                            </div>
                            <p className="text-xs font-medium truncate max-w-[300px]">{group.name}</p>
                          </div>
                          <div className="flex items-center gap-4 text-[9px] shrink-0">
                            <span className="text-muted-foreground tabular-nums">ID: {group.id}</span>
                            <button
                              onClick={(e) => handleRemoveAsset(e, group.name || "Unknown Asset Group", "Asset Group")}
                              className="p-1 border border-destructive/30 text-destructive hover:bg-red-600/10 rounded transition-all cursor-pointer shadow-sm"
                              title="Remove Permission"
                            >
                              <LogOut className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Applications */}
                {isYou && business.apps && business.apps.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-muted-foreground px-1">Applications ({business.apps.length})</div>
                    <div className="max-h-[400px] overflow-y-auto pr-1 space-y-0 custom-scrollbar border border-border/40 rounded-lg overflow-hidden">
                      {business.apps.map((app) => (
                        <div key={app.id} className={cn(
                          "py-1.5 px-2 bg-card flex items-center justify-between group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0"
                        )}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-5 h-5 bg-orange-50 rounded flex items-center justify-center shrink-0">
                              <Layout className="w-3 h-3 text-orange-600" />
                            </div>
                            <p className="text-xs font-medium truncate max-w-[300px]">{app.name}</p>
                          </div>
                          <div className="flex items-center gap-4 text-[9px] shrink-0 text-muted-foreground tabular-nums">
                            <span>ID: {app.id}</span>
                          </div>
                        </div>
                      ))}
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
      <Section title="Business Users" icon={Users2} count={allBusinessUsers.length}>
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
              subValue={user.email}
              extraSubValue={formatRole(displayRoles)}
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
        count={business.system_users?.length}
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

      <Section title="System User (Local DB)" icon={ShieldCheck} count={filteredSystemUsers.length}>
        {filteredSystemUsers.map((su) => (
          <Item
            key={su.id}
            isSelected={selectedUserId === su.id}
            onClick={() => {
              if (selectedUserId === su.id) {
                setSelectedUserId(null)
                setSelectedUserType(null)
              } else {
                setSelectedUserId(su.id)
                setSelectedUserType('local')
              }
            }}
            label={su.name}
            value={su.id}
            subValue={[formatRole(su.role || "System User"), su.appName].filter(Boolean).join(" • ")}
            status={su.status}
            isID
          />
        ))}
        {!filteredSystemUsers.length && <p className="text-xs text-muted-foreground italic pl-2">No local system users found</p>}
      </Section>
    </DetailContainer>
  )
}

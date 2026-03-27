"use client"

import React, { useState, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  ShieldCheck,
  CreditCard,
  Zap,
  Smartphone,
  Users,
  Layers,
  MessageSquare,
  Layout,
  Globe,
  Info,
  LayoutDashboard,
  Flag,
  Users2,
  Package,
  Megaphone,
  AppWindow,
  BadgeCheck,
  BadgeAlert,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  User,
  Mail,
  Fingerprint
} from "lucide-react"
import { BusinessRow } from "@/types/facebook"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BusinessDetailSheetProps {
  business: BusinessRow | null
  isOpen: boolean
  onClose: () => void
  systemUsers: any[]
  currentUser: any | null
  lastSync?: string
  onRecrawl?: () => void
  isRecrawling?: boolean
}

const Section = ({ title, icon: Icon, children, count }: { title: string; icon: React.ElementType; children: React.ReactNode; count?: number }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary/70" />
        <h4 className="text-sm font-normal tracking-tight">{title}</h4>
      </div>
      {count !== undefined && (
        <Badge variant="secondary" className="text-[10px] font-normal h-5">
          {count}
        </Badge>
      )}
    </div>
    <div className="grid gap-2">
      {children}
    </div>
  </div>
)

const Item = ({ label, value, subValue, status, isID, isSelected, onClick }: { label: string; value: string; subValue?: string; status?: string; isID?: boolean; isSelected?: boolean; onClick?: () => void }) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    toast.success(`${label} copied`)
  }

  return (
    <div 
      onClick={onClick}
      className={cn(
        "p-2.5 rounded-lg border flex items-center justify-between transition-all group cursor-pointer",
        isSelected 
          ? "border-primary bg-primary/5 ring-1 ring-primary/20" 
          : "border-border/40 bg-muted/20 hover:bg-muted/30"
      )}
    >
      <div className="space-y-0.5 min-w-0 flex-1">
        <p className="text-xs font-normal truncate pr-4">{label}</p>
        <p 
          className={cn(
            "text-[10px] text-muted-foreground font-mono truncate w-fit transition-colors",
            isID && "hover:text-primary cursor-pointer"
          )}
          onClick={isID ? handleCopy : undefined}
        >
          {isID ? `ID: ${value}` : value}
        </p>
        {subValue && <p className="text-[10px] text-primary/70 font-normal capitalize truncate">{(subValue || "").toLowerCase()}</p>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {status && (
          <Badge 
            variant={status === "Active" || status === "1" || status === "Current User" ? "outline" : "secondary"} 
            className={cn(
              "text-[8px] h-4 font-normal capitalize",
              (status === "Active" || status === "1" || status === "Current User") && "bg-green-600/10 text-green-600 border-green-600/20"
            )}
          >
            {(status === "1" ? "active" : status || "").toLowerCase()}
          </Badge>
        )}
      </div>
    </div>
  )
}

export function BusinessDetailSheet({ business, isOpen, onClose, systemUsers, currentUser, lastSync, onRecrawl, isRecrawling }: BusinessDetailSheetProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserType, setSelectedUserType] = useState<'business' | 'system' | 'local' | null>(null)

  // Reset selection when tab changes or sheet closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedUserId(null)
      setSelectedUserType(null)
    }
  }, [isOpen])

  if (!business) return null

  const filteredSystemUsers = systemUsers?.filter(u => (u.businessId || "").trim() === (business.id || "").trim()) || []

  const allBusinessUsers = [...(business.business_users?.data || [])]
  const isCurrentUserInList = allBusinessUsers.some(u => u.id === currentUser?.id)
  
  if (currentUser && !isCurrentUserInList) {
    allBusinessUsers.unshift({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email || "",
      role: "Current Agent"
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="!w-[60%] !max-w-none p-0 border-l border-border/50 bg-card/95 backdrop-blur-xl overflow-y-auto">
        <div className="h-full flex flex-col">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <SheetHeader className="px-6 pt-6 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1.5 flex-1">
                <SheetTitle className="text-xl font-normal tracking-tight flex items-center flex-wrap gap-2.5">
                  <div className="flex items-center gap-3 shrink-0">
                    {business.name}
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 h-6 flex items-center gap-1.5 capitalize border",
                        business.verification_status === "verified" 
                          ? "bg-blue-50 text-blue-600 border-blue-200" 
                          : "bg-red-50 text-red-600 border-red-200"
                      )}
                    >
                      {business.verification_status === "verified" ? (
                        <>
                          <BadgeCheck className="w-3.5 h-3.5 fill-blue-600/10" />
                          Verified
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="w-3.5 h-3.5 fill-red-600/10" />
                          Unverified
                        </>
                      )}
                    </Badge>
                    {business.permitted_roles && business.permitted_roles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {business.permitted_roles.map((r, i) => (
                          <Badge 
                            key={i}
                            variant="outline" 
                            className="text-[9px] font-medium px-2 py-0 h-4.5 bg-green-600/10 text-green-600 border-green-600/20 capitalize"
                          >
                            {r.toLowerCase()}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </SheetTitle>
                <div className="flex flex-col items-start gap-1 mt-1">
                  <SheetDescription 
                    className="text-xs font-mono hover:text-primary cursor-pointer transition-colors w-fit"
                    onClick={() => {
                      navigator.clipboard.writeText(business.id)
                      toast.success("Business ID copied")
                    }}
                  >
                    ID: {business.id}
                  </SheetDescription>
                  
                  <div 
                    className={cn(
                      "flex items-center gap-1.5 text-[10px] text-muted-foreground/60 select-none italic cursor-pointer hover:text-primary transition-colors",
                      isRecrawling && "text-green-600/80"
                    )}
                    onClick={onRecrawl}
                  >
                    <span>Last Sync: {lastSync || "Just now"}</span>
                    <RefreshCw className={cn("w-2.5 h-2.5", isRecrawling && "animate-spin text-green-600")} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {business.vertical && <Badge variant="outline" className="text-[10px] font-normal capitalize">{business.vertical.toLowerCase()}</Badge>}
              {business.timezone_id && <Badge variant="outline" className="text-[10px] font-normal">UTC {business.timezone_id}</Badge>}
            </div>
            
            <div className="w-full mt-6">
              <TabsList variant="line" className="justify-start gap-1 bg-transparent p-0 h-auto border-b-0 w-fit">
                <TabsTrigger value="overview" className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="team" className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer">
                  <Users2 className="w-3.5 h-3.5" />
                  Team
                </TabsTrigger>
                <TabsTrigger value="pages" className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer">
                  <Flag className="w-3.5 h-3.5" />
                  Pages
                </TabsTrigger>
                <TabsTrigger value="assets" className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer">
                  <Package className="w-3.5 h-3.5" />
                  Assets
                </TabsTrigger>
                <TabsTrigger value="application" className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer">
                  <AppWindow className="w-3.5 h-3.5" />
                  Application
                </TabsTrigger>
                <TabsTrigger value="ads" className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer">
                  <Megaphone className="w-3.5 h-3.5" />
                  Ads Manager
                </TabsTrigger>
              </TabsList>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <TabsContent value="overview" className="m-0 focus-visible:outline-none">
              <div className="space-y-8 pb-10">
                <Section title="Business Information" icon={Info}>
                  <Item label="Vertical" value={business.vertical || "N/A"} />
                  <Item label="Timezone" value={`UTC ${business.timezone_id || "N/A"}`} />
                  <Item label="Verification" value={business.verification_status || "not_verified"} status={business.verification_status === "verified" ? "Active" : "secondary"} />
                </Section>
              </div>
            </TabsContent>

            <TabsContent value="team" className="m-0 focus-visible:outline-none flex-1 overflow-hidden">
              <div className="flex h-full">
                {/* Left Column: List */}
                <div className={cn(
                  "p-6 space-y-8 overflow-y-auto custom-scrollbar transition-all duration-300",
                  selectedUserId ? "w-1/3" : "w-full"
                )}>
                  <Section title="Business Users" icon={Users2} count={allBusinessUsers.length}>
                    {allBusinessUsers.map((user: any) => {
                      const isYou = user.id === currentUser?.id
                      const displayRoles = isYou && business.permitted_roles && business.permitted_roles.length > 0
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
                          label={user.name + (isYou ? " (You)" : "")} 
                          value={user.id} 
                          subValue={[user.email, displayRoles].filter(Boolean).join(" • ")} 
                          isID
                          status={isYou ? "Current User" : undefined}
                        />
                      )
                    })}
                    {!allBusinessUsers.length && <p className="text-xs text-muted-foreground italic pl-2">No users listed</p>}
                  </Section>

                  <Section title="System Users" icon={ShieldCheck} count={business.system_users?.length}>
                    {business.system_users?.map((u: any) => (
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
                        subValue={u.role || "System User"} 
                        isID
                      />
                    ))}
                    {!business.system_users?.length && <p className="text-xs text-muted-foreground italic pl-2">No system users found via FB API</p>}
                  </Section>

                  <Section title="System User (Local DB)" icon={ShieldCheck} count={filteredSystemUsers.length}>
                    {filteredSystemUsers.map((u: any) => (
                      <Item 
                        key={u.id} 
                        isSelected={selectedUserId === u.id}
                        onClick={() => {
                          if (selectedUserId === u.id) {
                            setSelectedUserId(null)
                            setSelectedUserType(null)
                          } else {
                            setSelectedUserId(u.id)
                            setSelectedUserType('local')
                          }
                        }}
                        label={`${u.name}${u.appName ? ` • ${u.appName}` : ""}`} 
                        value={u.id} 
                        subValue={u.role || "System User"} 
                        status={u.status}
                        isID
                      />
                    ))}
                    {filteredSystemUsers.length === 0 && <p className="text-xs text-muted-foreground italic pl-2">No system users found for this BM</p>}
                  </Section>
                </div>

                {/* Right Column: Details */}
                {selectedUserId && (
                  <div className="w-2/3 border-l border-border/50 bg-muted/5 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300">
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                      {(() => {
                        const selectedUser = 
                          selectedUserType === 'business' ? allBusinessUsers.find(u => u.id === selectedUserId) :
                          selectedUserType === 'system' ? business.system_users?.find(u => u.id === selectedUserId) :
                          filteredSystemUsers.find(u => u.id === selectedUserId)

                        if (!selectedUser) return <div className="flex items-center justify-center h-full text-xs text-muted-foreground">Select a user to view details</div>

                        const isYou = selectedUserId === currentUser?.id
                        const assignedPages = isYou ? (business.pages || []) : []

                        return (
                          <div className="space-y-8">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-4 bg-primary/10 rounded-full border border-primary/20">
                                  <User className="w-8 h-8 text-primary" />
                                </div>
                                <div className="space-y-1">
                                  <h3 className="text-lg font-medium tracking-tight">
                                    {selectedUser.name}
                                    {isYou && <span className="text-xs text-muted-foreground ml-2">(You)</span>}
                                  </h3>
                                  <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="text-[10px] font-normal h-5 border-primary/20 bg-primary/5 text-primary">
                                      {selectedUser.role || (selectedUserType === 'system' ? 'System User' : 'Partner')}
                                    </Badge>
                                    {isYou && (
                                      <Badge variant="outline" className="text-[10px] font-normal h-5 border-green-600/20 bg-green-600/10 text-green-600">
                                        Active Token Holder
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Fingerprint className="w-3 h-3" />
                                Account Details
                              </h4>
                              <div className="grid gap-3 p-4 rounded-xl border border-border/50 bg-card/50">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">User ID</span>
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] select-all cursor-pointer hover:bg-muted/80">{selectedUser.id}</code>
                                </div>
                                {selectedUser.email && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium text-primary/80">{selectedUser.email}</span>
                                  </div>
                                )}
                                {selectedUser.appName && (
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Application</span>
                                    <span className="text-primary/70">{selectedUser.appName}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Package className="w-3 h-3" />
                                Assigned Assets
                              </h4>
                              
                              <div className="grid gap-2">
                                {assignedPages.length > 0 ? (
                                  <>
                                    <div className="text-[10px] text-muted-foreground px-1">Pages ({assignedPages.length})</div>
                                    <div className="grid gap-2">
                                      {assignedPages.map(page => (
                                        <div key={page.id} className="p-3 rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-blue-50 rounded flex items-center justify-center">
                                              <Flag className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="space-y-0.5">
                                              <p className="text-xs font-medium truncate max-w-[150px]">{page.name}</p>
                                              <p className="text-[10px] text-muted-foreground">{page.category}</p>
                                            </div>
                                          </div>
                                          <div className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                            ID: {page.id}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </>
                                ) : (
                                  <div className="p-8 border border-dashed border-border/60 rounded-xl flex flex-col items-center justify-center text-center space-y-2">
                                    <Package className="w-6 h-6 text-muted-foreground/30" />
                                    <p className="text-xs text-muted-foreground italic">
                                      {isYou ? "No assigned pages found for this identity" : "Asset visibility restricted for non-local accounts"}
                                    </p>
                                  </div>
                                )}
                                
                                {isYou && business.owned_ad_accounts?.data && (
                                  <div className="mt-4 space-y-2">
                                    <div className="text-[10px] text-muted-foreground px-1">Ad Accounts ({business.owned_ad_accounts.data.length})</div>
                                    <div className="grid gap-2">
                                      {business.owned_ad_accounts.data.map(acc => (
                                        <div key={acc.id} className="p-3 rounded-lg border border-border/40 bg-card flex items-center gap-3">
                                          <div className="w-8 h-8 bg-green-50 rounded flex items-center justify-center">
                                            <CreditCard className="w-4 h-4 text-green-600" />
                                          </div>
                                          <div className="space-y-0.5">
                                            <p className="text-xs font-medium">{acc.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{acc.id} • {acc.currency}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="pages" className="m-0 focus-visible:outline-none">
              <div className="space-y-8 pb-10">
                <Section title="Business Pages" icon={Flag} count={business.pages?.length}>
                  {business.pages?.map((page) => (
                    <Item
                      key={page.id}
                      label={page.name}
                      value={page.id}
                      subValue={page.category}
                      isID
                    />
                  ))}
                  {!business.pages?.length && <p className="text-xs text-muted-foreground italic pl-2">No pages found</p>}
                </Section>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="m-0 focus-visible:outline-none">
              <div className="space-y-8 pb-10">
                <Section title="Tracking Pixels" icon={Zap} count={business.adspixels?.data?.length}>
                  {business.adspixels?.data?.map((pix: { id: string; name: string }) => (
                    <Item key={pix.id} label={pix.name} value={pix.id} isID />
                  ))}
                  {!business.adspixels?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No pixels found</p>}
                </Section>

                <Section title="WhatsApp Business" icon={MessageSquare} count={business.whatsapp_business_accounts?.data?.length}>
                  {business.whatsapp_business_accounts?.data?.map((wa: { id: string; name: string; status: string }) => (
                    <Item key={wa.id} label={wa.name} value={wa.id} status={wa.status} isID />
                  ))}
                  {!business.whatsapp_business_accounts?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No WhatsApp accounts found</p>}
                </Section>

                <Section title="Asset Groups" icon={Layers} count={business.business_asset_groups?.data?.length}>
                  {business.business_asset_groups?.data?.map((group: { id: string; name: string }) => (
                    <Item key={group.id} label={group.name} value={group.id} isID />
                  ))}
                  {!business.business_asset_groups?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No asset groups found</p>}
                </Section>
              </div>
            </TabsContent>

            <TabsContent value="application" className="m-0 focus-visible:outline-none">
              <div className="space-y-8 pb-10">
                <Section title="Connected Applications" icon={Smartphone} count={business.apps?.length}>
                  {business.apps?.map((app: { id: string; name: string; category?: string }) => (
                    <Item key={app.id} label={app.name} value={app.id} subValue={app.category} isID />
                  ))}
                  {!business.apps?.length && <p className="text-xs text-muted-foreground italic pl-2">No apps linked</p>}
                </Section>
              </div>
            </TabsContent>

            <TabsContent value="ads" className="m-0 focus-visible:outline-none">
              <div className="space-y-8 pb-10">
                <Section title="Ad Accounts" icon={CreditCard} count={business.owned_ad_accounts?.data?.length}>
                  {business.owned_ad_accounts?.data?.map((acc: { id: string; name: string; currency: string; amount_spent?: string; account_status: number | string }) => (
                    <Item
                      key={acc.id}
                      label={acc.name}
                      value={acc.id}
                      subValue={`${acc.currency} • Spent: ${acc.amount_spent || "0"}`}
                      status={acc.account_status.toString()}
                      isID
                    />
                  ))}
                  {!business.owned_ad_accounts?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No ad accounts found</p>}
                </Section>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}

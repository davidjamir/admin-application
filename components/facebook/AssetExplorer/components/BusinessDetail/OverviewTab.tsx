"use client"

import React from "react"
import { 
  Users2, Flag, Activity, 
  ShieldCheck, ShieldAlert, Zap, Ban, Globe, 
  CreditCard, Instagram, MessageSquare, 
  CheckCircle2, Share2, KeyRound, User, Layers,
  LayoutGrid, Handshake
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow } from "@/types/facebook"
import { Section, Item } from "./SharedComponents"
import { cn } from "@/lib/utils"

interface OverviewTabProps {
  business: BusinessRow
  allBusinessUsers: { id: string; name: string; email: string; role: string }[]
}

const formatRole = (role?: string) => {
  if (!role) return ""
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
}

const LabelWithIcon = ({ icon: Icon, children, colorClass }: { icon: React.ElementType, children: React.ReactNode, colorClass?: string }) => (
  <div className="flex items-center gap-2">
    <Icon className={cn("w-3.5 h-3.5 shrink-0", colorClass || "text-primary/60")} />
    <span>{children}</span>
  </div>
)

const ScrollableList = ({ children, count, maxItems = 5, className, isFlexible }: { children: React.ReactNode, count: number, maxItems?: number, className?: string, isFlexible?: boolean }) => (
  <div className={cn(
    "space-y-0 relative",
    (count > maxItems || isFlexible) && cn("overflow-y-auto pr-1 custom-scrollbar", className || "max-h-[300px]"),
    isFlexible && "flex-1 min-h-[220px]" // Min height for ~5 items
  )}>
    {children}
  </div>
)

const SectionFooter = ({ count, type, tabName }: { count: number, type: string, tabName: string }) => {
  if (count === 0) return null
  return (
    <p className="text-[9px] text-center text-muted-foreground/60 italic pt-2 border-t border-border/20 mx-2">
      Explore all {count} {type} and details in the {tabName} tab.
    </p>
  )
}

export const OverviewTab = ({ business, allBusinessUsers }: OverviewTabProps) => {
  // Full Asset Lists
  const allPages = business.pages || []
  const pagesCount = allPages.length
  
  const allAdAccounts = business.owned_ad_accounts?.data || []
  const adAccountsCount = allAdAccounts.length

  const allSystemUsers = business.system_users || []
  const allBizUsers = allBusinessUsers || []
  const totalTeamCount = allSystemUsers.length + allBizUsers.length

  const allApps = business.apps || []
  const appsCount = allApps.length

  const allGroups = business.business_asset_groups?.data || []
  const groupsCount = allGroups.length

  // Ecosystem Status
  const pixelCount = business.adspixels?.data?.length || 0
  const instagramCount = business.instagram_accounts?.data?.length || 0
  const whatsappCount = business.whatsapp_business_accounts?.data?.length || 0

  return (
    <div className="pb-10 animate-in fade-in slide-in-from-bottom-3 duration-500 h-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch h-full">
        {/* Left Column: Slave Column (Fills remaining height) */}
        <div className="flex flex-col gap-6 min-h-0 h-full w-full">
          <Section title="Business Health Status" icon={ShieldCheck}>
            <Item 
              label={<LabelWithIcon icon={business.verification_status === "verified" ? CheckCircle2 : ShieldAlert}>Verification</LabelWithIcon>} 
              value={formatRole(business.verification_status || "not_verified")} 
              status={business.verification_status === "verified" ? "Active" : "secondary"}
            />
            <Item 
              label={<LabelWithIcon icon={business.is_promotable ? Zap : Ban}>Promotion Status</LabelWithIcon>} 
              value={business.is_promotable ? "Eligible" : "Ineligible"} 
              status={business.is_promotable ? "Active" : "secondary"}
            />
            <Item 
              label={<LabelWithIcon icon={Share2}>Sharing Eligibility</LabelWithIcon>} 
              value={business.sharing_eligibility_status?.replace(/_/g, ' ').toLowerCase() || "N/A"} 
            />
          </Section>

          <Section title="Ecosystem Connections" icon={Globe}>
            <div className="grid grid-cols-2 gap-2 px-1">
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-card border border-border/40">
                <div className="flex items-center justify-between">
                  <Instagram className="w-4 h-4 text-pink-600" />
                  <Badge variant={instagramCount > 0 ? "outline" : "secondary"} className="h-4 text-[8px]">
                    {instagramCount > 0 ? "Linked" : "Disconnected"}
                  </Badge>
                </div>
                <p className="text-[10px] font-medium mt-1">Instagram</p>
                <p className="text-[10px] text-muted-foreground">{instagramCount} connected</p>
              </div>
              <div className="flex flex-col gap-2 p-3 rounded-xl bg-card border border-border/40">
                <div className="flex items-center justify-between">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <Badge variant={whatsappCount > 0 ? "outline" : "secondary"} className="h-4 text-[8px]">
                    {whatsappCount > 0 ? "Linked" : "Disconnected"}
                  </Badge>
                </div>
                <p className="text-[10px] font-medium mt-1">WhatsApp</p>
                <p className="text-[10px] text-muted-foreground">{whatsappCount} connected</p>
              </div>
            </div>
            <Item 
              label={<LabelWithIcon icon={Activity}>Meta Pixels</LabelWithIcon>} 
              value={`${pixelCount} Pixel${pixelCount === 1 ? '' : 's'} assigned`} 
              status={pixelCount > 0 ? "Active" : "secondary"}
            />
          </Section>

          <Section 
            title="Ad Accounts" 
            icon={CreditCard} 
            count={adAccountsCount > 0 ? adAccountsCount : undefined}
          >
            <ScrollableList count={adAccountsCount} className="max-h-[200px]">
              {allAdAccounts.length > 0 ? (
                allAdAccounts.map(acc => (
                  <Item 
                    key={acc.id}
                    label={acc.name}
                    value={acc.id}
                    subValue={`${acc.currency} • Spent: ${acc.amount_spent || "0"}`}
                    status={acc.account_status.toString()}
                    isID
                  />
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic px-2">No ad accounts found</p>
              )}
            </ScrollableList>
            <SectionFooter count={adAccountsCount} type="ad accounts" tabName="Ads" />
          </Section>

          <Section 
            title="Agency Partners" 
            icon={Handshake}
          >
            <p className="text-[10px] text-muted-foreground italic px-2">No agency partners identified yet</p>
          </Section>

          <Section 
            title="Pages" 
            icon={Flag} 
            count={pagesCount > 0 ? pagesCount : undefined}
          >
            <ScrollableList count={pagesCount} maxItems={11} className="max-h-[500px] border border-border/20 rounded-lg">
              {allPages.length > 0 ? (
                allPages.map(page => (
                  <Item 
                    key={page.id}
                    label={page.name}
                    value={page.id}
                    isID
                    extraSubValue={page.source ? `Source: ${page.source}` : undefined}
                  />
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic px-2">No pages found</p>
              )}
            </ScrollableList>
            <SectionFooter count={pagesCount} type="pages" tabName="Pages" />
          </Section>
        </div>

        {/* Right Column: Master Column (Dictates the Grid height) */}
        <div className="flex flex-col gap-6 min-h-0 h-full">
          <Section 
            title="Core Team Highlights" 
            icon={Users2}
            action={
              <div className="flex items-center gap-2">
                {allBizUsers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="px-1.5 h-4 text-[8px] bg-slate-100 text-slate-600 font-mono">
                      {allBizUsers.length}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-medium text-nowrap">Account Users</span>
                  </div>
                )}
                {allBizUsers.length > 0 && allSystemUsers.length > 0 && (
                  <div className="w-px h-2 bg-border/40" />
                )}
                {allSystemUsers.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="px-1.5 h-4 text-[8px] bg-amber-50 text-amber-600 font-mono border-amber-100">
                      {allSystemUsers.length}
                    </Badge>
                    <span className="text-[9px] text-muted-foreground font-medium text-nowrap">System User</span>
                  </div>
                )}
              </div>
            }
          >
            <ScrollableList count={totalTeamCount} maxItems={4} className="max-h-[220px]">
              {/* System Users (from FB API) */}
              {allSystemUsers.length > 0 && allSystemUsers.map(u => (
                <Item 
                  key={u.id}
                  label={
                    <div className="flex items-center gap-2 truncate">
                      <KeyRound className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="font-bold truncate">{u.name}</span>
                      <Badge variant="outline" className="text-[8px] h-4 font-normal border-slate-200 bg-slate-50 text-slate-500 shrink-0 capitalize">
                        System user
                      </Badge>
                      <Badge variant="outline" className="text-[8px] h-4 font-normal border-green-200 bg-green-50 text-green-600 shrink-0 capitalize">
                        {formatRole(u.role || "Admin")}
                      </Badge>
                    </div>
                  }
                  value={u.id}
                  isID
                />
              ))}
              {/* Business Users (People from FB API) */}
              {allBizUsers.length > 0 && allBizUsers.map(u => (
                <Item 
                  key={u.id}
                  label={
                    <div className="flex items-center gap-2 truncate">
                      <User className="w-3 h-3 text-blue-600 shrink-0" />
                      <span className="font-medium truncate">{u.name}</span>
                      <Badge variant="outline" className="text-[8px] h-4 font-normal border-slate-200 bg-slate-50 text-slate-500 shrink-0 capitalize">
                        Account user
                      </Badge>
                      <Badge variant="outline" className="text-[8px] h-4 font-normal border-green-200 bg-green-50 text-green-600 shrink-0 capitalize">
                        {formatRole(u.role || "User")}
                      </Badge>
                    </div>
                  }
                  value={u.id}
                  extraSubValue={u.email}
                  isID
                />
              ))}
            </ScrollableList>
            <SectionFooter count={totalTeamCount} type="team members" tabName="Team" />
          </Section>

          <Section 
            title="Business Asset Groups" 
            icon={Layers} 
            count={groupsCount > 0 ? groupsCount : undefined}
          >
            <ScrollableList count={groupsCount} className="max-h-[220px]">
              {allGroups.length > 0 ? (
                allGroups.map(group => (
                  <Item 
                    key={group.id}
                    label={group.name}
                    value={group.id}
                    isID
                  />
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic px-2 py-4">No asset groups found</p>
              )}
            </ScrollableList>
            <SectionFooter count={groupsCount} type="asset groups" tabName="Assets" />
          </Section>

          <Section 
            title="Applications" 
            icon={LayoutGrid} 
            count={appsCount > 0 ? appsCount : undefined}
          >
            {/* Applications is fixed-height in this version to act as the primary height anchor */}
            <ScrollableList count={appsCount} maxItems={10} className="max-h-[460px] border border-border/20 rounded-lg">
              {allApps.length > 0 ? (
                allApps.map(app => (
                  <Item 
                    key={app.id}
                    label={app.name}
                    value={app.id}
                    imageUrl={app.icon_url}
                    isID
                    extraSubValue={app.source ? formatRole(app.source) : undefined}
                  />
                ))
              ) : (
                <p className="text-[10px] text-muted-foreground italic px-2 py-4 text-center">No linked applications found</p>
              )}
            </ScrollableList>
            <SectionFooter count={appsCount} type="applications" tabName="Applications" />
          </Section>
        </div>
      </div>
    </div>
  )
}

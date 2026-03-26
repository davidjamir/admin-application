"use client"

import React from "react"
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
  MessageSquare
} from "lucide-react"
import { BusinessRow } from "@/types/facebook"

interface BusinessDetailSheetProps {
  business: BusinessRow | null
  isOpen: boolean
  onClose: () => void
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

const Item = ({ label, value, subValue, status }: { label: string; value: string; subValue?: string; status?: string }) => (
  <div className="p-2.5 rounded-lg border border-border/40 bg-muted/20 flex items-center justify-between hover:bg-muted/30 transition-colors">
    <div className="space-y-0.5">
      <p className="text-xs font-normal truncate max-w-[200px]">{label}</p>
      <p className="text-[10px] text-muted-foreground font-mono">{value}</p>
      {subValue && <p className="text-[10px] text-primary/70 font-normal capitalize">{(subValue || "").toLowerCase()}</p>}
    </div>
    {status && (
      <Badge variant={status === "Active" || status === "1" ? "default" : "secondary"} className="text-[8px] h-4 font-normal capitalize">
        {(status === "1" ? "active" : status || "").toLowerCase()}
      </Badge>
    )}
  </div>
)

export function BusinessDetailSheet({ business, isOpen, onClose }: BusinessDetailSheetProps) {
  if (!business) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[60vw] w-full p-0 border-l border-border/50 bg-card/95 backdrop-blur-xl">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-xl font-normal tracking-tight flex items-center gap-2">
                  {business.name}
                  {business.verification_status === "verified" && (
                    <ShieldCheck className="w-5 h-5 text-blue-500 fill-blue-500/10" />
                  )}
                </SheetTitle>
                <SheetDescription className="text-xs font-mono">
                  ID: {business.id}
                </SheetDescription>
              </div>
            </div>
             <div className="flex gap-2 mt-4">
                {business.vertical && <Badge variant="outline" className="text-[10px] font-normal capitalize">{business.vertical.toLowerCase()}</Badge>}
                {business.timezone_id && <Badge variant="outline" className="text-[10px] font-normal">UTC {business.timezone_id}</Badge>}
             </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="space-y-8 pb-10">
              {/* Ad Accounts */}
              <Section title="Ad Accounts" icon={CreditCard} count={business.owned_ad_accounts?.data?.length}>
                {business.owned_ad_accounts?.data?.map((acc: { id: string; name: string; currency: string; amount_spent?: string; account_status: number | string }) => (
                  <Item 
                    key={acc.id} 
                    label={acc.name} 
                    value={acc.id} 
                    subValue={`${acc.currency} • Spent: ${acc.amount_spent || "0"}`}
                    status={acc.account_status.toString()}
                  />
                ))}
                {!business.owned_ad_accounts?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No ad accounts found</p>}
              </Section>

              {/* Pixels */}
              <Section title="Tracking Pixels" icon={Zap} count={business.adspixels?.data?.length}>
                {business.adspixels?.data?.map((pix: { id: string; name: string }) => (
                  <Item key={pix.id} label={pix.name} value={pix.id} />
                ))}
                {!business.adspixels?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No pixels found</p>}
              </Section>

              {/* Apps */}
              <Section title="Connected Applications" icon={Smartphone} count={business.apps?.length}>
                {business.apps?.map((app: { id: string; name: string; category?: string }) => (
                  <Item key={app.id} label={app.name} value={app.id} subValue={app.category} />
                ))}
                {!business.apps?.length && <p className="text-xs text-muted-foreground italic pl-2">No apps linked</p>}
              </Section>

              {/* WhatsApp */}
              <Section title="WhatsApp Business" icon={MessageSquare} count={business.whatsapp_business_accounts?.data?.length}>
                {business.whatsapp_business_accounts?.data?.map((wa: { id: string; name: string; status: string }) => (
                  <Item key={wa.id} label={wa.name} value={wa.id} status={wa.status} />
                ))}
                {!business.whatsapp_business_accounts?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No WhatsApp accounts found</p>}
              </Section>

              {/* Users */}
              <Section title="Business Users" icon={Users} count={business.business_users?.data?.length}>
                {business.business_users?.data?.map((user: { id: string; name: string; email: string; role: string }) => (
                  <Item key={user.id} label={user.name} value={user.email} subValue={user.role} />
                ))}
                {!business.business_users?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No users listed</p>}
              </Section>

               {/* Asset Groups */}
               <Section title="Asset Groups" icon={Layers} count={business.business_asset_groups?.data?.length}>
                {business.business_asset_groups?.data?.map((group: { id: string; name: string }) => (
                  <Item key={group.id} label={group.name} value={group.id} />
                ))}
                {!business.business_asset_groups?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No asset groups found</p>}
              </Section>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

"use client"

import React, { useState } from "react"
import { Layers, Zap, MessageSquare, Pencil, Globe, Users, BadgeAlert, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow } from "@/types/facebook"
import { cn } from "@/lib/utils"
import { Section, DetailContainer, Item } from "./SharedComponents"

interface AssetsTabProps {
  business: BusinessRow
}

export const AssetsTab = ({ business }: AssetsTabProps) => {
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<string | null>(null)
  const [selectedPixelId, setSelectedPixelId] = useState<string | null>(null)
  const [selectedWhatsAppId, setSelectedWhatsAppId] = useState<string | null>(null)

  const clearSelections = () => {
    setSelectedAssetGroupId(null)
    setSelectedPixelId(null)
    setSelectedWhatsAppId(null)
  }

  const selectedId = selectedAssetGroupId || selectedPixelId || selectedWhatsAppId
  const type = selectedAssetGroupId ? "Asset Group" : selectedPixelId ? "Tracking Pixel" : "WhatsApp Account"
  const selectedItem =
    (selectedAssetGroupId ? business.business_asset_groups?.data?.find(g => g.id === selectedAssetGroupId) :
      selectedPixelId ? business.adspixels?.data?.find(p => p.id === selectedPixelId) :
        business.whatsapp_business_accounts?.data?.find(w => w.id === selectedWhatsAppId)) as { id: string; name: string } | undefined

  return (
    <DetailContainer
      isOpen={!!selectedId}
      onClose={clearSelections}
      detailContent={
        selectedItem ? (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                  {selectedAssetGroupId ? <Layers className="w-8 h-8 text-primary" /> :
                    selectedPixelId ? <Zap className="w-8 h-8 text-primary" /> :
                      <MessageSquare className="w-8 h-8 text-primary" />}
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium tracking-tight">
                    {selectedItem.name || selectedItem.id}
                  </h3>
                  <Badge variant="outline" className="text-[10px] font-normal h-5 border-primary/20 bg-primary/5 text-primary">
                    {type}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Management Tasks
              </h4>
              <div className="grid gap-2">
                {[
                  { label: `Update ${type}`, description: `Change settings for this ${type.toLowerCase()}`, icon: Pencil },
                  { label: "Assign Partners", description: "Share this asset with other businesses", icon: Globe },
                  { label: "Manage Permissions", description: "Control who can access this asset", icon: Users },
                  ...(selectedAssetGroupId ? [{ label: "Delete Group", description: "Permanently remove this asset group", icon: BadgeAlert, variant: "destructive" }] : [])
                ].map((task, i) => (
                  <div key={i} className="p-3 rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded flex items-center justify-center",
                        (task as { variant?: string }).variant === "destructive" ? "bg-red-50" : "bg-primary/5"
                      )}>
                        <task.icon className={cn("w-4 h-4", (task as { variant?: string }).variant === "destructive" ? "text-red-600" : "text-primary")} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium">{task.label}</p>
                        <p className="text-[10px] text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null
      }
    >
      <Section title="Asset Groups" icon={Layers} count={business.business_asset_groups?.data?.length}>
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

      <Section title="Tracking Pixels" icon={Zap} count={business.adspixels?.data?.length}>
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

      <Section title="WhatsApp Business" icon={MessageSquare} count={business.whatsapp_business_accounts?.data?.length}>
        {business.whatsapp_business_accounts?.data?.map((wa) => (
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
    </DetailContainer>
  )
}

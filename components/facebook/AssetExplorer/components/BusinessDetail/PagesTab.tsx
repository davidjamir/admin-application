"use client"

import React, { useState } from "react"
import { Flag, Zap, Tag, Users2, Copy, ShieldCheck, ChevronRight, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow, FacebookPage } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"

interface PagesTabProps {
  business: BusinessRow
}

export const PagesTab = ({ business }: PagesTabProps) => {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)

  const selectedPage = business.pages?.find(p => p.id === selectedPageId)
  const isReadOnly = selectedPage?.source === "asset_group"

  const ownedPages = business.pages?.filter(p => !p.source || p.source === "owned") || []
  const clientPages = business.pages?.filter(p => p.source === "client") || []
  const assetGroupPages = business.pages?.filter(p => p.source === "asset_group") || []

  return (
    <DetailContainer
      isOpen={!!selectedPageId}
      onClose={() => setSelectedPageId(null)}
      detailContent={
        selectedPage ? (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <Flag className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium tracking-tight">{selectedPage.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] font-normal h-5 border-blue-200 bg-blue-50 text-blue-600 capitalize">
                      {selectedPage.source === "asset_group" ? "Asset Group Page" : "Business Page"}
                    </Badge>
                    {selectedPage.source && (
                      <Badge variant="secondary" className="text-[10px] font-normal h-5 capitalize">
                        Source: {selectedPage.source}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isReadOnly ? (
              <div className="p-6 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Read-Only Asset</span>
                </div>
                <p className="text-xs text-amber-600 leading-relaxed">
                  This page is shared with you via an <strong>Asset Group</strong>. Administrative actions such as role management or token generation must be performed by the Business Manager that owns this asset group.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  Advanced Tasks
                </h4>
                <div className="grid gap-2">
                  {[
                    { label: "Update Page Category", description: "Change how your page is classified", icon: Tag },
                    { label: "Manage Roles", description: "Assign people to manage this page", icon: Users2 },
                    { label: "Copy Access Token", description: "Get the long-lived page access token", icon: Copy },
                    { label: "Business Integrity", description: "Check page health and restrictions", icon: ShieldCheck }
                  ].map((task, i) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null
      }
    >
      <div className="space-y-6">
        {ownedPages.length > 0 && (
          <Section title="Owned Pages" icon={ShieldCheck} count={ownedPages.length}>
            {ownedPages.map((page: FacebookPage) => (
              <Item
                key={page.id}
                isSelected={selectedPageId === page.id}
                onClick={() => setSelectedPageId(selectedPageId === page.id ? null : page.id)}
                label={page.name}
                value={page.id}
                subValue={page.category}
                isID
              />
            ))}
          </Section>
        )}

        {clientPages.length > 0 && (
          <Section title="Shared / Client Pages" icon={Users2} count={clientPages.length}>
            {clientPages.map((page: FacebookPage) => (
              <Item
                key={page.id}
                isSelected={selectedPageId === page.id}
                onClick={() => setSelectedPageId(selectedPageId === page.id ? null : page.id)}
                label={page.name}
                value={page.id}
                subValue={page.category}
                isID
              />
            ))}
          </Section>
        )}

        {assetGroupPages.length > 0 && (
          <Section title="Asset Group Pages" icon={Package} count={assetGroupPages.length}>
            <div className="mb-2 px-2 py-1.5 rounded-md bg-muted/30 border border-border/50">
              <p className="text-[10px] text-muted-foreground leading-snug">
                These assets are shared via Business Asset Groups. You have read-only access to their information.
              </p>
            </div>
            {assetGroupPages.map((page: FacebookPage) => (
              <Item
                key={page.id}
                isSelected={selectedPageId === page.id}
                onClick={() => setSelectedPageId(selectedPageId === page.id ? null : page.id)}
                label={page.name}
                value={page.id}
                subValue={page.category}
                isID
              />
            ))}
          </Section>
        )}

        {!business.pages?.length && <p className="text-xs text-muted-foreground italic pl-2">No pages found</p>}
      </div>
    </DetailContainer>
  )
}

"use client"

import React, { useState } from "react"
import { Flag, Zap, Tag, Users2, Copy, ShieldCheck, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow, FacebookPage } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"

interface PagesTabProps {
  business: BusinessRow
}

export const PagesTab = ({ business }: PagesTabProps) => {
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)

  const selectedPage = business.pages?.find(p => p.id === selectedPageId)

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
                  <Badge variant="outline" className="text-[10px] font-normal h-5 border-blue-200 bg-blue-50 text-blue-600">
                    Business Page
                  </Badge>
                </div>
              </div>
            </div>

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
          </div>
        ) : null
      }
    >
      <Section title="Business Pages" icon={Flag} count={business.pages?.length}>
        {business.pages?.map((page: FacebookPage) => (
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
        {!business.pages?.length && <p className="text-xs text-muted-foreground italic pl-2">No pages found</p>}
      </Section>
    </DetailContainer>
  )
}

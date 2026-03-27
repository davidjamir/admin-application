"use client"

import React, { useState } from "react"
import { CreditCard, Zap, ExternalLink, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"

interface AdsManagerTabProps {
  business: BusinessRow
}

export const AdsManagerTab = ({ business }: AdsManagerTabProps) => {
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<string | null>(null)

  const selectedAcc = business.owned_ad_accounts?.data?.find(a => a.id === selectedAdAccountId)

  return (
    <DetailContainer
      isOpen={!!selectedAdAccountId}
      onClose={() => setSelectedAdAccountId(null)}
      detailContent={
        selectedAcc ? (
          <div className="space-y-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <CreditCard className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-medium tracking-tight">{selectedAcc.name}</h3>
                  <Badge variant="outline" className="text-[10px] font-normal h-5 border-green-200 bg-green-50 text-green-600">
                    Ad Account
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
                <div className="p-3 rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-primary/5 flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium">Open Ads Manager</p>
                      <p className="text-[10px] text-muted-foreground">Manage campaigns and billing</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        ) : null
      }
    >
      <Section title="Ad Accounts" icon={CreditCard} count={business.owned_ad_accounts?.data?.length}>
        {business.owned_ad_accounts?.data?.map((acc) => (
          <Item
            key={acc.id}
            isSelected={selectedAdAccountId === acc.id}
            onClick={() => setSelectedAdAccountId(selectedAdAccountId === acc.id ? null : acc.id)}
            label={acc.name}
            value={acc.id}
            subValue={`${acc.currency} • Spent: ${acc.amount_spent || "0"}`}
            status={acc.account_status.toString()}
            isID
          />
        ))}
        {!business.owned_ad_accounts?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No ad accounts found</p>}
      </Section>
    </DetailContainer>
  )
}

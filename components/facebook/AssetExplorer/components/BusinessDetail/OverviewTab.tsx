"use client"

import React from "react"
import { LayoutDashboard, Info } from "lucide-react"
import { BusinessRow } from "@/types/facebook"
import { Section, Item } from "./SharedComponents"

interface OverviewTabProps {
  business: BusinessRow
  allBusinessUsersCount: number
}

export const OverviewTab = ({ business, allBusinessUsersCount }: OverviewTabProps) => {
  return (
    <div className="space-y-8 pb-10">
      <Section title="Asset Summary" icon={LayoutDashboard}>
        <Item label="Team Members" value={allBusinessUsersCount.toString()} />
        <Item label="Pages" value={(business.pages?.length || 0).toString()} />
        <Item label="Applications" value={(business.apps?.length || 0).toString()} />
        <Item label="Asset Groups" value={(business.business_asset_groups?.data?.length || 0).toString()} />
        <Item label="Pixels" value={(business.adspixels?.data?.length || 0).toString()} />
      </Section>

      <Section title="Business Information" icon={Info}>
        <Item label="Vertical" value={business.vertical || "N/A"} />
        <Item label="Timezone" value={`UTC ${business.timezone_id || "N/A"}`} />
        <Item label="Verification" value={business.verification_status || "not_verified"} status={business.verification_status === "verified" ? "Active" : "secondary"} />
      </Section>
    </div>
  )
}

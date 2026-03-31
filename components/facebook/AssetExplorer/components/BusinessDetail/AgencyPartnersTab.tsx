"use client"

import React, { useState } from "react"
import { Handshake } from "lucide-react"
import { Section, DetailContainer } from "./SharedComponents"

export const AgencyPartnersTab = () => {
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null)

  // Placeholder for future agency partner data
  const agencyPartners: { id: string; name: string }[] = []

  return (
    <DetailContainer
      isOpen={!!selectedPartnerId}
      onClose={() => setSelectedPartnerId(null)}
      detailContent={
        <div className="space-y-8 text-sm text-muted-foreground px-4 text-center">
          Partner details will appear here once linked.
        </div>
      }
    >
      <Section 
        title="Agency Partners" 
        icon={Handshake} 
        count={agencyPartners.length > 0 ? agencyPartners.length : undefined}
      >
        {agencyPartners.length > 0 ? (
          agencyPartners.map((partner) => (
            <div key={partner.id} className="p-3 border-b border-border/50">
              {partner.name}
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground italic pl-2 pt-2 pb-4">
            No agency partners linked to this business manager yet.
          </p>
        )}
      </Section>
    </DetailContainer>
  )
}

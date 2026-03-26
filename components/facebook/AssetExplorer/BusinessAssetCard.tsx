"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { BusinessRow } from "@/types/facebook"
import { BusinessCardHeader } from "./components/BusinessAssetCard/BusinessCardHeader"
import { SelectionShortcuts } from "./components/BusinessAssetCard/SelectionShortcuts"
import { PageListTable } from "./components/BusinessAssetCard/PageListTable"

type Props = {
  business: BusinessRow
  selectedPageIds: string[]
  onSelectionChange: (ids: string[]) => void
  onOpenDetails: () => void
}

export default function BusinessAssetCard({ 
  business, 
  selectedPageIds, 
  onSelectionChange,
  onOpenDetails
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const allIdsInBm = useMemo(() => business.pages.map(p => p.id), [business.pages])
  const selectedInBm = useMemo(() => selectedPageIds.filter(id => allIdsInBm.includes(id)), [selectedPageIds, allIdsInBm])
  const isAllSelected = allIdsInBm.length > 0 && allIdsInBm.every(id => selectedPageIds.includes(id))
  
  const activePart = useMemo(() => {
    const total = business.pages.length
    if (total === 0 || selectedInBm.length === 0) return null
    const third = Math.ceil(total / 3)
    const selectedSet = new Set(selectedInBm)

    const getPartIds = (part: 1 | 2 | 3) => {
        const start = part === 1 ? 0 : part === 2 ? third : Math.ceil(2 * total / 3)
        const end = part === 1 ? third : part === 2 ? Math.min(Math.ceil(2 * total / 3), total) : total
        return business.pages.slice(start, end).map(p => p.id)
    }

    for (const part of [1, 2, 3] as const) {
        const partIds = getPartIds(part)
        if (selectedInBm.length === partIds.length && partIds.every(id => selectedSet.has(id))) return part
    }
    return null
  }, [business.pages, selectedInBm])

  const handleToggleSelection = (id: string) => {
    onSelectionChange(
      selectedPageIds.includes(id) 
        ? selectedPageIds.filter(prevId => prevId !== id)
        : [...selectedPageIds, id]
    )
  }

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(Array.from(new Set([...selectedPageIds, ...allIdsInBm])))
    } else {
      onSelectionChange(selectedPageIds.filter(id => !allIdsInBm.includes(id)))
    }
  }

  const handleSelectThird = (part: 1 | 2 | 3) => {
    const total = business.pages.length
    if (total === 0) return
    const third = Math.ceil(total / 3)
    const start = part === 1 ? 0 : part === 2 ? third : Math.ceil(2 * total / 3)
    const end = part === 1 ? third : part === 2 ? Math.min(Math.ceil(2 * total / 3), total) : total
    
    const slice = business.pages.slice(start, end).map(p => p.id)
    const otherSelections = selectedPageIds.filter(id => !allIdsInBm.includes(id))
    onSelectionChange([...otherSelections, ...slice])
    toast.info(`Selected part ${part}/3 for ${business.name} (${slice.length} items)`)
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}`)
  }

  return (
    <div className="border border-border/50 bg-card/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg transition-all hover:shadow-primary/5">
      <BusinessCardHeader 
        business={business}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isAllSelected={isAllSelected}
        handleToggleAll={handleToggleAll}
        onOpenDetails={onOpenDetails}
      />

      {!isCollapsed && (
        <div className="overflow-x-auto">
          {business.pages.length > 0 && (
            <SelectionShortcuts 
              selectedInBmCount={selectedInBm.length}
              activePart={activePart}
              handleSelectThird={handleSelectThird}
              onClear={() => {
                onSelectionChange(selectedPageIds.filter(id => !allIdsInBm.includes(id)))
                toast.info("Cleared BM selection")
              }}
            />
          )}
          <PageListTable 
            pages={business.pages}
            assignedPageIds={business.assignedPageIds}
            selectedPageIds={selectedPageIds}
            handleToggleSelection={handleToggleSelection}
            handleCopy={handleCopy}
          />
        </div>
      )}
    </div>
  )
}

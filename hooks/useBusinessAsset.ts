import { useState, useMemo, useCallback } from "react"
import { toast } from "sonner"
import { FacebookBusiness, FacebookPage } from "@/types/facebook"

export interface BusinessRow extends FacebookBusiness {
  pages: FacebookPage[]
  assignedPageIds: string[]
}

export function useBusinessAsset(
  business: BusinessRow,
  selectedPageIds: string[],
  onSelectionChange: (ids: string[]) => void
) {
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
      let start = 0
      let end = third
      if (part === 2) {
        start = third
        end = Math.min(Math.ceil(2 * total / 3), total)
      } else if (part === 3) {
        start = Math.ceil(2 * total / 3)
        end = total
      }
      return business.pages.slice(start, end).map(p => p.id)
    }

    for (const part of [1, 2, 3] as const) {
      const partIds = getPartIds(part)
      if (selectedInBm.length === partIds.length && partIds.every(id => selectedSet.has(id))) {
        return part
      }
    }
    return null
  }, [business.pages, selectedInBm])

  const handleToggleSelection = useCallback((id: string) => {
    onSelectionChange(
      selectedPageIds.includes(id)
        ? selectedPageIds.filter(prevId => prevId !== id)
        : [...selectedPageIds, id]
    )
  }, [selectedPageIds, onSelectionChange])

  const handleToggleAll = useCallback((checked: boolean) => {
    if (checked) {
      const newIds = Array.from(new Set([...selectedPageIds, ...allIdsInBm]))
      onSelectionChange(newIds)
    } else {
      onSelectionChange(selectedPageIds.filter(id => !allIdsInBm.includes(id)))
    }
  }, [selectedPageIds, allIdsInBm, onSelectionChange])

  const handleSelectThird = useCallback((part: 1 | 2 | 3) => {
    const total = business.pages.length
    if (total === 0) return

    const third = Math.ceil(total / 3)
    let start = 0
    let end = third

    if (part === 2) {
      start = third
      end = Math.min(Math.ceil(2 * total / 3), total)
    } else if (part === 3) {
      start = Math.ceil(2 * total / 3)
      end = total
    }

    const slice = business.pages.slice(start, end).map(p => p.id)
    const otherSelections = selectedPageIds.filter(id => !allIdsInBm.includes(id))
    onSelectionChange([...otherSelections, ...slice])
    toast.info(`Selected part ${part}/3 for ${business.name} (${slice.length} items)`)
  }, [business.pages, business.name, selectedPageIds, allIdsInBm, onSelectionChange])

  const handleClearSelection = useCallback(() => {
    onSelectionChange(selectedPageIds.filter(id => !allIdsInBm.includes(id)))
    toast.info("Cleared BM selection")
  }, [selectedPageIds, allIdsInBm, onSelectionChange])

  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}`)
  }, [])

  return {
    isCollapsed, setIsCollapsed,
    allIdsInBm, selectedInBm, isAllSelected, activePart,
    handleToggleSelection, handleToggleAll, handleSelectThird,
    handleClearSelection, handleCopy
  }
}

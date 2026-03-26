import { FacebookPage, SystemUser } from "@/types/facebook"

export interface DiscoveryPipelineProps {
    selectedBmFilter: string
    setSelectedBmFilter: (val: string) => void
    bmFilterOptions: Array<{ id: string; name: string }>
    selectedSystemUserId: string
    setSelectedSystemUserId: (val: string) => void
    filteredSystemUsers: SystemUser[]
    loadingPages: boolean
    saving: boolean
    isAdminVerified: boolean
    pages: FacebookPage[]
    selectedPageIds: string[]
    handlePageSave: () => void
}

export interface AssetTableProps {
    pages: FacebookPage[]
    selectedPageIds: string[]
    setSelectedPageIds: (ids: string[] | ((prev: string[]) => string[])) => void
    loadingPages: boolean
    activePart: number | null
    handleSelectThird: (part: 1 | 2 | 3) => void
}

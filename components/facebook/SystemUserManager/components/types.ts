import { SystemUser } from "@/types/facebook"

export interface IngestionControlsProps {
    crawlToken: string
    setCrawlToken: (val: string) => void
    handleCrawl: () => void
    crawling: boolean
}

export interface UserTableProps {
    users: SystemUser[]
    search: string
    setSearch: (val: string) => void
    selectedBmFilter: string
    setSelectedBmFilter: (val: string) => void
    bmFilterOptions: Array<{ id: string; name: string }>
    recrawlingIds: Set<string>
    saving: boolean
    handleRecrawl: (userId: string) => void
    handleSave: (user: SystemUser) => void
    handleDelete: (user: SystemUser) => void
}

export interface DeleteDialogProps {
    user: SystemUser | null
    onClose: () => void
    onConfirm: () => void
    saving: boolean
}

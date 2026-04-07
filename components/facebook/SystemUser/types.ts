import { SystemUser } from "@/types/facebook"

export interface HubHeaderProps {
    status: string
}

export interface HubFiltersProps {
    search: string
    setSearch: (val: string) => void
    selectedBmFilter: string
    setSelectedBmFilter: (val: string) => void
    bmFilterOptions: { id: string, name: string }[]
    loadingUsers: boolean
    onRefresh: () => void
    isSheetOpen: boolean
    setIsSheetOpen: (val: boolean) => void
    selectedStatusFilter: string
    setSelectedStatusFilter: (val: string) => void
}

export interface AddUserSheetProps {
    isSheetOpen: boolean
    setIsSheetOpen: (val: boolean) => void
    addForm: {
        token: string
        businessId: string
        businessName: string
        appName: string
        category: string
        name: string
        id: string
        lastSyncedToken: string
        role: "Admin" | "Employee"
        roleCode: string
    }
    setAddForm: (val: AddUserSheetProps["addForm"]) => void
    crawling: boolean
    saving: boolean
    handleSave: (user: SystemUser) => Promise<boolean>
}

export interface SystemUserTableProps {
    users: SystemUser[]
    recrawlingIds: Set<string>
    onRecrawl: (user: SystemUser) => void
    onDelete: (user: SystemUser) => void
    onEdit: (user: SystemUser) => void
}

export interface SystemUserTableRowProps {
    index: number
    user: SystemUser
    isRecrawling: boolean
    onRecrawl: (user: SystemUser) => void
    onDelete: (user: SystemUser) => void
    onEdit: (user: SystemUser) => void
}

export interface EditUserSheetProps {
    editingUser: SystemUser | null
    setEditingUser: (user: SystemUser | null) => void
    editForm: {
        name: string
        token: string
        businessId: string
        businessName: string
        appName: string
        category: string
    }
    setEditForm: (val: EditUserSheetProps["editForm"]) => void
    saving: boolean
    handleEditSave: () => void
}

export interface DeleteUserDialogProps {
    deletingUser: SystemUser | null
    setDeletingUser: (user: SystemUser | null) => void
    saving: boolean
    confirmDelete: () => void
}

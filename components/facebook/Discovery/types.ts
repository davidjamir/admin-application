import { FacebookPage, SystemUser } from "@/types/facebook"

export interface DiscoveryControlsProps {
  isAdminVerified: boolean
  systemUsers: SystemUser[]
  selectedSystemUserId: string
  setSelectedSystemUserId: (id: string) => void
  selectedUser: SystemUser | undefined
  handlePageSave: () => Promise<void>
  saving: boolean
  loadingPages: boolean
  pagesCount: number
  selectedPageIdsCount: number
}

export interface DiscoveryTableProps {
  loadingPages: boolean
  pages: FacebookPage[]
  selectedPageIds: string[]
  setSelectedPageIds: (ids: string[] | ((prev: string[]) => string[])) => void
  handleCopy: (text: string, label: string) => Promise<void>
}

export interface DiscoveryTableRowProps {
  page: FacebookPage
  isSelected: boolean
  onToggle: () => void
  handleCopy: (text: string, label: string) => Promise<void>
}

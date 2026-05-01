import { MongoPageData, PageDetails } from "@/hooks/useFacebookPages"

export interface PageHeaderProps {
  searchQuery: string
  setSearchQuery: (val: string) => void
  categoryFilter: string
  setCategoryFilter: (val: string) => void
  availableCategories: string[]
}

export interface PageStatsProps {
  fetchedAt: number | null
  handleRefresh: () => Promise<void>
  pageCount: number | null
  categoryFilter: string
  searchQuery: string
}

export interface PageGridProps {
  data: MongoPageData[]
  loading: boolean
  selectedPageId: string | undefined
  handlePageClick: (page: MongoPageData) => void
  handleDeletePage: (page: MongoPageData) => Promise<void>
  getHealthColor: (ts: number) => string
  formatExactRelative: (ts: number) => string | null
  getLatestScheduledAt: (page: MongoPageData) => number
}

export interface PageCardProps {
  page: MongoPageData
  isSelected: boolean
  onClick: () => void
  onDelete: (page: MongoPageData) => Promise<void>
  getHealthColor: (ts: number) => string
  formatExactRelative: (ts: number) => string | null
  getLatestScheduledAt: (page: MongoPageData) => number
}

export interface PageDetailSheetProps {
  selectedPage: MongoPageData
  onClose: () => void
  details: PageDetails | null
  detailsLoading: boolean
  activeTab: "queue" | "history"
  setActiveTab: (tab: "queue" | "history") => void
  showToken: boolean
  setShowToken: (val: boolean) => void
  getHealthColor: (ts: number) => string
  getLatestScheduledAt: (page: MongoPageData) => number
  setDetails: (details: PageDetails) => void
  onDelete: (page: MongoPageData) => Promise<void>
  onRefresh?: () => void
}

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
}

export interface PageGridProps {
  data: MongoPageData[]
  loading: boolean
  selectedPageId: string | undefined
  handlePageClick: (page: MongoPageData) => void
  getHealthColor: (ts: number) => string
  formatExactRelative: (ts: number) => string | null
}

export interface PageCardProps {
  page: MongoPageData
  isSelected: boolean
  onClick: () => void
  getHealthColor: (ts: number) => string
  formatExactRelative: (ts: number) => string | null
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
  setDetails: (details: PageDetails) => void
}

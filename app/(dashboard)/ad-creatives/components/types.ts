import { AdItem, SortKey, SortDir } from "@/hooks/useAdCreatives"

export interface AdCreativeHeaderProps {
  fetchedAt: number | null
  refreshing: boolean
  fetchData: (force?: boolean) => Promise<void>
  onAddOpen: () => void
}

export interface AdCreativeStatsProps {
  items: AdItem[]
}

export interface AdCreativeFiltersProps {
  search: string
  setSearch: (val: string) => void
  sourceFilter: string
  setSourceFilter: (val: string) => void
  domainFilter: string
  setDomainFilter: (val: string) => void
  enabledFilter: "all" | "enabled" | "disabled"
  setEnabledFilter: (val: "all" | "enabled" | "disabled") => void
  sources: string[]
  domainsInUI: string[]
}

export interface AdCreativeTableProps {
  sorted: AdItem[]
  selectedId: string | undefined
  sortKey: SortKey
  sortDir: SortDir
  handleSort: (key: SortKey) => void
  onOpenDetail: (item: AdItem) => void
  totalCount: number
}

export interface AdCreativeDetailPanelProps {
  selected: AdItem
  editing: boolean
  editForm: AdItem | null
  setEditForm: (item: AdItem | ((prev: AdItem | null) => AdItem | null)) => void
  saving: boolean
  onClose: () => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => Promise<void>
  onDelete: (id: string) => Promise<void>
  websiteOrigins: string[]
}

export interface AdCreativeAddPanelProps {
  onClose: () => void
  form: typeof import("@/hooks/useAdCreatives").EMPTY_FORM
  setForm: (form: typeof import("@/hooks/useAdCreatives").EMPTY_FORM | ((prev: typeof import("@/hooks/useAdCreatives").EMPTY_FORM) => typeof import("@/hooks/useAdCreatives").EMPTY_FORM)) => void
  submitting: boolean
  onSubmit: (e: React.FormEvent) => Promise<void>
  websiteOrigins: string[]
}

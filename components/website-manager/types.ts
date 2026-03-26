import { Blog, Wrap, QuotaGroup, TabKey, SelectedItem } from "@/hooks/useWebsiteManager"

export interface WebsiteHeaderProps {
    fetchedAt: number | null
    onRefresh: () => void
    refreshing: boolean
    fetchData: (force?: boolean) => Promise<void>
}

export interface WebsiteStatsProps {
    loading: boolean
    tab: TabKey
    setTab: (tab: TabKey) => void
    setSearch: (val: string) => void
    counts: { blogs: number; wraps: number; quotas: number }
}

export interface OriginStatsChartProps {
    loading: boolean
    originHistory: Record<string, number | string>[]
    allOriginNames: string[]
    originFilter: string
    setOriginFilter: (val: string) => void
}

export interface NavigationTabsProps {
    tab: TabKey
    setTab: (tab: TabKey) => void
    setSearch: (val: string) => void
    counts: { blogs: number; wraps: number; quotas: number }
    loading: boolean
}

export interface TabFiltersProps {
    tab: TabKey
    search: string
    setSearch: (val: string) => void
    originFilter: string
    setOriginFilter: (val: string) => void
    originList: string[]
    channelFilter?: string
    setChannelFilter?: (val: string) => void
    channelList?: string[]
    dateFilter?: string
    setDateFilter?: (val: string) => void
    dateList?: string[]
    todayStr?: string
}

export interface SortableTHProps {
    label: string
    col: string
    align?: "left" | "center" | "right"
    className?: string
    sort: {
        toggle: (col: string) => void
        Icon: React.FC<{ col: string }>
        key: string
    }
}

export interface BlogsTableProps {
    loading: boolean
    blogs: Blog[]
    selectedId?: string
    onSelect: (item: SelectedItem) => void
}

export interface WrapsTableProps {
    loading: boolean
    wraps: Wrap[]
    selectedId?: string
    onSelect: (item: SelectedItem) => void
}

export interface QuotasTableProps {
    loading: boolean
    quotas: QuotaGroup[]
    selectedId?: string
    onSelect: (item: SelectedItem) => void
}

export interface DetailsPanelProps {
    selected: SelectedItem | null
    onClose: () => void
    onCopy: (text: string, label: string) => void
    allDates: string[]
    dateFilter: string
}

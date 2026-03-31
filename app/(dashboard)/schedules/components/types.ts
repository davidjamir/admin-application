import { QueueItem } from "@/hooks/useQueues"

export interface ScheduleHeaderProps {
  lastSyncTime: number
  isRefreshing: boolean
  loading: boolean
  fetchData: (forced?: boolean) => Promise<void>
  nextSyncProgress: number
}

export interface QueueSectionProps {
  title: string
  items?: QueueItem[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stats?: { total: number; [key: string]: any }
  icon: React.ReactNode
  onCopy: (id: string) => void
  type: string
}

export interface MetricProps {
  label: string
  value: string | number
  icon: React.ReactNode
  highlight?: boolean
}

export interface QueueItemRecordProps {
  item: QueueItem
  type: string
  onCopy: () => void
}

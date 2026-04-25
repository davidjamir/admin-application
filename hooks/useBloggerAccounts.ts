import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export interface BloggerAccount {
  _id: string
  email: string
  accessToken: string
  refreshToken: string
  expired: string | { $date: string }
  createdAt: string | { $date: string }
  updatedAt: string | { $date: string }
  scope: string
  version: number
}

const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000

interface FetchAccountsOptions {
  silent?: boolean
}

export function useBloggerAccounts() {
  const [accounts, setAccounts] = useState<BloggerAccount[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async (options?: FetchAccountsOptions) => {
    const silent = options?.silent ?? false

    try {
      if (!silent) {
        setLoading(true)
      }
      const res = await fetch('/api/blogger-accounts')
      const json = await res.json()
      if (json.data) {
        setAccounts(json.data)
      } else if (!silent) {
        toast.error(json.error || 'Failed to fetch accounts')
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      if (!silent) {
        toast.error('Failed to fetch accounts')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    fetchAccounts()

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== 'visible') {
        return
      }

      fetchAccounts({ silent: true })
    }, AUTO_REFRESH_INTERVAL_MS)

    return () => window.clearInterval(intervalId)
  }, [fetchAccounts])

  return {
    accounts,
    loading,
    refresh: fetchAccounts
  }
}

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

export function useBloggerAccounts() {
  const [accounts, setAccounts] = useState<BloggerAccount[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/blogger-accounts')
      const json = await res.json()
      if (json.data) {
        setAccounts(json.data)
      } else {
        toast.error(json.error || 'Failed to fetch accounts')
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error)
      toast.error('Failed to fetch accounts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return {
    accounts,
    loading,
    refresh: fetchAccounts
  }
}

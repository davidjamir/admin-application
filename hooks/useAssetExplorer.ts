"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { facebookService } from "@/services/facebook.service"
import { FacebookBusiness, FacebookPage, SystemUser, BusinessRow, FacebookUser } from "@/types/facebook"
import { useDebounce } from "./use-debounce"

const TOKEN_STORAGE_KEY = "fb_asset_explorer_token"
const TOKEN_TTL = 2 * 60 * 60 * 1000 // 2 hours

export function useAssetExplorer(adminPassword: string, isAdminVerified: boolean) {
  const [mode, setMode] = useState<"system-user" | "account-user">("system-user")
  const [loading, setLoading] = useState(false)
  
  // Data State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
  const [businesses, setBusinesses] = useState<FacebookBusiness[]>([])
  const [businessRows, setBusinessRows] = useState<BusinessRow[]>([])
  const [standalonePages, setStandalonePages] = useState<FacebookPage[]>([])
  const [systemUserPages, setSystemUserPages] = useState<FacebookPage[]>([])
  const [recrawlingIds, setRecrawlingIds] = useState<Set<string>>(new Set())
  const [currentUser, setCurrentUser] = useState<FacebookUser | null>(null)
  const [lastSyncTime, setLastSyncTime] = useState<string>("")
  
  // selection state (Separate for each mode)
  const [activeSystemUserToken, setActiveSystemUserToken] = useState("")
  const [activeSystemUserId, setActiveSystemUserId] = useState("")
  
  const [manualToken, setManualToken] = useState("")
  const [activeAccountUserToken, setActiveAccountUserToken] = useState("")
  const [activeAccountUserId, setActiveAccountUserId] = useState("")
  
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])

  // Detail Sheet State
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessRow | null>(null)

  const openBusinessDetail = (business: BusinessRow) => {
    setSelectedBusiness(business)
    setIsDetailSheetOpen(true)
  }

  // Persist token to localStorage
  const saveTokenToStorage = useCallback((token: string) => {
    if (!token) {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        return
    }
    const expiry = Date.now() + TOKEN_TTL
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, expiry }))
  }, [])

  // Load token from localStorage on init
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (stored) {
        try {
            const { token, expiry } = JSON.parse(stored)
            if (Date.now() < expiry) {
                setManualToken(token)
            } else {
                localStorage.removeItem(TOKEN_STORAGE_KEY)
            }
        } catch (e) {
            console.error("Failed to parse stored token", e)
        }
    }
  }, [])

  const fetchSystemUserAssets = useCallback(async (token: string, userId: string) => {
    if (!token) return
    try {
      setLoading(true)
      setSelectedPageIds([])
      setActiveSystemUserToken(token)
      setActiveSystemUserId(userId)

      const pages = await facebookService.getPages(token)
      setSystemUserPages(pages)
      const now = new Date()
      const formattedSync = `${now.toLocaleString('en-US', { month: 'short' })} ${now.getDate()},${now.getFullYear()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
      setLastSyncTime(formattedSync)
      toast.success("System user assets synchronized")
    } catch {
      toast.error("Discovery failed. Check system user permissions.")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAccountUserAssets = useCallback(async (token: string, userId: string) => {
    if (!token) return
    try {
      setLoading(true)
      setSelectedPageIds([])
      setActiveAccountUserToken(token)
      setActiveAccountUserId(userId)

      const [bms, allUserPages] = await Promise.all([
        facebookService.getBusinesses(token),
        facebookService.getPages(token)
      ])
      setBusinesses(bms)
      
      const rows = await Promise.all(bms.map(async (bm) => {
        try {
          const res = await fetch(`/api/facebook/business/${bm.id}?token=${token}`)
          if (res.ok) {
            const fullData: BusinessRow = await res.json()
            const pageIds = (fullData.pages || []).map((p: FacebookPage) => p.id)
            
            const assignedPageIds = await facebookService.getAssignedPageIdsInBusinessBatch(
              token, 
              bm.id, 
              userId, 
              pageIds
            ).catch(() => [] as string[])

            return {
              ...bm,
              ...fullData,
              pages: fullData.pages || [],
              assignedPageIds
            }
          }
        } catch (e) {
          console.error(`Failed to fetch rich details for BM ${bm.id}`, e)
        }

        const [ownedPages, clientPages] = await Promise.all([
          facebookService.getBusinessPages(token, bm.id),
          facebookService.getBusinessClientPages(token, bm.id).catch(() => [] as FacebookPage[])
        ])
        
        const allPages = [...ownedPages, ...clientPages]
        const uniquePages = Array.from(new Map(allPages.map(p => [p.id, p])).values())
        const pageIds = uniquePages.map(p => p.id)
        const assignedPageIds = await facebookService.getAssignedPageIdsInBusinessBatch(
          token, 
          bm.id, 
          userId, 
          pageIds
        ).catch(() => [] as string[])

        return {
          ...bm,
          pages: uniquePages,
          assignedPageIds
        }
      }))
      
      setBusinessRows(rows)
      const now = new Date()
      const formattedSync = `${now.toLocaleString('en-US', { month: 'short' })} ${now.getDate()},${now.getFullYear()} ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
      setLastSyncTime(formattedSync)

      const bmPageIds = new Set(rows.flatMap(bm => (bm.pages || []).map(p => p.id)))
      const standalone = allUserPages.filter(p => !bmPageIds.has(p.id))
      
      setStandalonePages(standalone)
      toast.success("Account user assets synchronized")
    } catch {
      toast.error("Discovery failed. Check account token authority.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRecrawlBusiness = useCallback(async (businessId: string) => {
    if (!activeAccountUserToken || !activeAccountUserId) return
    
    try {
      setRecrawlingIds(prev => new Set(prev).add(businessId))
      const res = await fetch(`/api/facebook/business/${businessId}?token=${activeAccountUserToken}&force=true`)
      if (!res.ok) throw new Error("Failed to recrawl business")
      
      const fullData: BusinessRow = await res.json()
      const pageIds = (fullData.pages || []).map((p: FacebookPage) => p.id)
      
      const assignedPageIds = await facebookService.getAssignedPageIdsInBusinessBatch(
        activeAccountUserToken, 
        businessId, 
        activeAccountUserId, 
        pageIds
      ).catch(() => [] as string[])

      const updatedRow: BusinessRow = {
        ...businessRows.find(b => b.id === businessId)!,
        ...fullData,
        pages: fullData.pages || [],
        assignedPageIds
      }

      setBusinessRows(prev => prev.map(b => b.id === businessId ? updatedRow : b))
      setSelectedBusiness(updatedRow)
      
      const allUserPages = await facebookService.getPages(activeAccountUserToken)
      const allRows = businessRows.map(b => b.id === businessId ? updatedRow : b)
      const bmPageIds = new Set(allRows.flatMap(bm => (bm.pages || []).map(p => p.id)))
      const standalone = allUserPages.filter(p => !bmPageIds.has(p.id))
      setStandalonePages(standalone)
      
      toast.success("Business data refreshed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Recrawl failed")
    } finally {
      setRecrawlingIds(prev => {
        const next = new Set(prev)
        next.delete(businessId)
        return next
      })
    }
  }, [activeAccountUserToken, activeAccountUserId, businessRows])

  const handleManualSync = useCallback(async () => {
    if (!manualToken.trim()) {
      toast.error("Please provide an Access Token")
      return
    }
    
    try {
      setLoading(true)
      const me = await facebookService.getMe(manualToken.trim())
      setCurrentUser(me)
      toast.success(`Identity Verified: ${me.name}`)
      await fetchAccountUserAssets(manualToken.trim(), me.id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Manual sync failed")
    } finally {
      setLoading(false)
    }
  }, [manualToken, fetchAccountUserAssets])

  // Auto-sync when manualToken changes (debounced)
  const debouncedToken = useDebounce(manualToken, 500)
  
  const [lastSyncedToken, setLastSyncedToken] = useState("")

  useEffect(() => {
    if (mode === "account-user" && debouncedToken && debouncedToken !== lastSyncedToken) {
        saveTokenToStorage(debouncedToken)
        void handleManualSync()
        setLastSyncedToken(debouncedToken)
    } else if (mode === "account-user" && !debouncedToken) {
        saveTokenToStorage("")
        setLastSyncedToken("")
    }
  }, [debouncedToken, lastSyncedToken, saveTokenToStorage, handleManualSync, mode])

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<FacebookPage | null>(null)

  // Note: Data clearing on mode switch is removed to allow persistent state between tabs.
  // Instead, we only clear selected page IDs to prevent action confusion.
  useEffect(() => {
    setSelectedPageIds([])
  }, [mode])
  
  const loadSystemUsers = useCallback(async (password: string) => {
    try {
      const res = await fetch("/api/database/systemUsers/secure-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)
      setSystemUsers(data.data ?? [])
    } catch {
      toast.error("Identity sync failed")
    }
  }, [])

  useEffect(() => {
    if (!isAdminVerified) return
    void loadSystemUsers(adminPassword)
  }, [isAdminVerified, adminPassword, loadSystemUsers])





  const [selectedBmFilter, setSelectedBmFilter] = useState("all")
  const [selectedSystemAdminId, setSelectedSystemAdminId] = useState("")

  const bmFilterOptions = useMemo(() => {
    const seen = new Set<string>()
    return systemUsers
      .map((u) => ({ id: (u.businessId ?? "").trim(), name: (u.businessName ?? "—").trim() || "—" }))
      .filter((bm) => bm.id && !seen.has(bm.id) && seen.add(bm.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [systemUsers])

  const filteredSystemUsers = useMemo(() => {
    const activeUsers = systemUsers.filter((u) => (u.status || "Active") === "Active")
    if (selectedBmFilter === "all") return activeUsers
    return activeUsers.filter((u) => (u.businessId ?? "").trim() === selectedBmFilter)
  }, [systemUsers, selectedBmFilter])

  const handleCopyUserToken = (token: string) => {
    if (token) {
      navigator.clipboard.writeText(token)
      toast.success("Access Token copied")
    }
  }

  const activeSystemUser = useMemo(() => {
    return systemUsers.find(u => u.id === activeSystemUserId)
  }, [systemUsers, activeSystemUserId])

  const availableAdmins = useMemo(() => {
    if (!activeSystemUser) return []
    const activeAdmins = systemUsers.filter(u => (u.status || "Active") === "Active" && (u.role || "").toLowerCase() === "admin")
    
    if ((activeSystemUser.role || "").toLowerCase() === "admin") {
      return [activeSystemUser]
    }
    return activeAdmins.filter(u => 
      u.businessId === activeSystemUser.businessId && 
      u.appName === activeSystemUser.appName
    )
  }, [systemUsers, activeSystemUser])

  useEffect(() => {
    if (!activeSystemUser) {
      setSelectedSystemAdminId("")
      return
    }

    const role = (activeSystemUser.role || "").toLowerCase()
    if (role === "admin") {
      setSelectedSystemAdminId(activeSystemUser.id)
    } else if (role === "employee") {
      const currentAdminValid = availableAdmins.some(a => a.id === selectedSystemAdminId)
      if (!currentAdminValid) {
        setSelectedSystemAdminId(availableAdmins.length > 0 ? availableAdmins[0].id : "")
      }
    } else {
      setSelectedSystemAdminId("")
    }
  }, [activeSystemUser, availableAdmins, selectedSystemAdminId])

  return {
    mode, setMode,
    loading, setLoading,
    systemUsers, loadSystemUsers,
    businesses,
    businessRows, setBusinessRows,
    standalonePages, setStandalonePages,
    systemUserPages, setSystemUserPages,
    activeSystemUserToken, setActiveSystemUserToken,
    activeSystemUserId, setActiveSystemUserId,
    activeAccountUserToken, setActiveAccountUserToken,
    activeAccountUserId, setActiveAccountUserId,
    manualToken, setManualToken,
    selectedPageIds, setSelectedPageIds,
    isEditModalOpen, setIsEditModalOpen,
    editingPage, setEditingPage,
    currentUser,
    activeSystemUser,
    availableAdmins,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    selectedBusiness,
    openBusinessDetail,
    fetchSystemUserAssets,
    fetchAccountUserAssets,
    handleRecrawlBusiness,
    recrawlingIds,
    handleManualSync,
    handleCopyUserToken,
    selectedBmFilter, setSelectedBmFilter,
    selectedSystemAdminId, setSelectedSystemAdminId,
    bmFilterOptions,
    filteredSystemUsers,
    lastSyncTime
  }
}

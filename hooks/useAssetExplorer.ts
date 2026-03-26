"use client"

import { useCallback, useEffect, useState, useMemo } from "react"
import { toast } from "sonner"
import { facebookService } from "@/services/facebook.service"
import { FacebookBusiness, FacebookPage, SystemUser, BusinessRow } from "@/types/facebook"
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
  
  // selection state
  const [activeViewerToken, setActiveViewerToken] = useState("")
  const [activeViewerId, setActiveViewerId] = useState("")
  const [manualToken, setManualToken] = useState("")
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

  const handleFetchAssets = useCallback(async (token: string, userId: string) => {
    if (!token) return
    try {
      setLoading(true)
      setSelectedPageIds([])
      setActiveViewerToken(token)
      setActiveViewerId(userId)

      if (mode === "system-user") {
        const pages = await facebookService.getPages(token)
        setStandalonePages(pages)
        setBusinessRows([])
      } else {
        const bms = await facebookService.getBusinesses(token)
        setBusinesses(bms)
        
        const rows = await Promise.all(bms.map(async (bm) => {
          try {
            const res = await fetch(`/api/facebook/business/${bm.id}?token=${token}&force=true`)
            if (res.ok) {
              const fullData: BusinessRow = await res.json()
              const pageIds = (fullData.pages || []).map((p: FacebookPage) => p.id)
              
              // Still fetch assigned pages for the current identity
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

          // Fallback to minimal data if API fails
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
        setStandalonePages([])
      }
      toast.success("Asset pool synchronized")
    } catch {
      toast.error("Discovery failed. Check token authority.")
    } finally {
      setLoading(false)
    }
  }, [mode])

  const handleManualSync = useCallback(async () => {
    if (!manualToken.trim()) {
      toast.error("Please provide an Access Token")
      return
    }
    
    try {
      setLoading(true)
      const me = await facebookService.getMe(manualToken.trim())
      toast.success(`Identity Verified: ${me.name}`)
      await handleFetchAssets(manualToken.trim(), me.id)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Manual sync failed")
    } finally {
      setLoading(false)
    }
  }, [manualToken, handleFetchAssets])

  // Auto-sync when manualToken changes (debounced)
  const debouncedToken = useDebounce(manualToken, 500)
  
  const [lastSyncedToken, setLastSyncedToken] = useState("")

  useEffect(() => {
    if (debouncedToken && debouncedToken !== lastSyncedToken) {
        saveTokenToStorage(debouncedToken)
        void handleManualSync()
        setLastSyncedToken(debouncedToken)
    } else if (!debouncedToken) {
        saveTokenToStorage("")
        setLastSyncedToken("")
    }
  }, [debouncedToken, lastSyncedToken, saveTokenToStorage, handleManualSync])

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<FacebookPage | null>(null)

  // Clear data when switching modes
  useEffect(() => {
    setBusinessRows([])
    setStandalonePages([])
    setActiveViewerToken("")
    setActiveViewerId("")
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

  const handleCopyUserToken = () => {
    if (activeViewerToken) {
      navigator.clipboard.writeText(activeViewerToken)
      toast.success("Access Token copied")
    }
  }

  const activeSystemUser = useMemo(() => {
    return systemUsers.find(u => u.id === activeViewerId)
  }, [systemUsers, activeViewerId])

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
    activeViewerToken, setActiveViewerToken,
    activeViewerId, setActiveViewerId,
    manualToken, setManualToken,
    selectedPageIds, setSelectedPageIds,
    isEditModalOpen, setIsEditModalOpen,
    editingPage, setEditingPage,
    activeSystemUser,
    availableAdmins,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    selectedBusiness,
    openBusinessDetail,
    handleFetchAssets,
    handleManualSync,
    handleCopyUserToken,
    selectedBmFilter, setSelectedBmFilter,
    selectedSystemAdminId, setSelectedSystemAdminId,
    bmFilterOptions,
    filteredSystemUsers
  }
}

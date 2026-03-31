import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from "sonner"
import { facebookService } from "@/services/facebook.service"
import { FacebookPage, SystemUser } from "@/types/facebook"

export function useTokenIngestion(adminPassword: string, isAdminVerified: boolean) {
    const [status, setStatus] = useState("Select Business Manager to begin discovery.")
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
    const [selectedBmFilter, setSelectedBmFilter] = useState("all")
    const [selectedSystemUserId, setSelectedSystemUserId] = useState("")
    const [pages, setPages] = useState<FacebookPage[]>([])
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const [loadingPages, setLoadingPages] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)

    const bmFilterOptions = useMemo(() => {
        const seen = new Set<string>()
        return systemUsers
            .map((u) => ({ id: (u.businessId ?? "").trim(), name: (u.businessName ?? "—").trim() || "—" }))
            .filter((bm) => bm.id && !seen.has(bm.id) && seen.add(bm.id))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [systemUsers])

    const filteredSystemUsers = useMemo(() => {
        if (selectedBmFilter === "all") return systemUsers
        return systemUsers.filter((u) => (u.businessId ?? "").trim() === selectedBmFilter)
    }, [systemUsers, selectedBmFilter])

    const selectedUser = useMemo(() => systemUsers.find((u) => u.id === selectedSystemUserId), [systemUsers, selectedSystemUserId])

    const activePart = useMemo(() => {
        const total = pages.length
        if (total === 0 || selectedPageIds.length === 0) return null

        const third = Math.ceil(total / 3)
        const selectedSet = new Set(selectedPageIds)

        const getPartIds = (part: 1 | 2 | 3) => {
            let start = 0
            let end = third
            if (part === 2) {
                start = third
                end = Math.min(Math.ceil(2 * total / 3), total)
            } else if (part === 3) {
                start = Math.ceil(2 * total / 3)
                end = total
            }
            return pages.slice(start, end).map(p => p.id)
        }

        for (const part of [1, 2, 3] as const) {
            const partIds = getPartIds(part)
            if (selectedPageIds.length === partIds.length && partIds.every(id => selectedSet.has(id))) {
                return part
            }
        }
        return null
    }, [pages, selectedPageIds])

    const loadSystemUsers = useCallback(async (password: string) => {
        try {
            setLoadingUsers(true)
            const res = await fetch("/api/database/systemUsers/secure-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Failed to load personnel")
            const allUsers: SystemUser[] = data.data ?? []
            setSystemUsers(allUsers.filter(u => u.status !== "Disabled"))
        } catch {
            toast.error("Identity sync failed")
        } finally {
            setLoadingUsers(false)
        }
    }, [])

    useEffect(() => {
        if (!isAdminVerified || !adminPassword.trim()) {
            setSystemUsers([])
            setSelectedBmFilter("all")
            setSelectedSystemUserId("")
            setPages([])
            return
        }
        void loadSystemUsers(adminPassword.trim())
    }, [isAdminVerified, adminPassword, loadSystemUsers])

    useEffect(() => {
        const token = selectedUser?.token
        if (!isAdminVerified || !token) {
            setPages([])
            return
        }

        const fetchPages = async () => {
            try {
                setLoadingPages(true)
                setStatus(`Crawling assets for ${selectedUser.name}...`)
                const fetchedPages = await facebookService.getPages(token)
                const mappedPages = fetchedPages.map(p => ({
                    ...p,
                    topic: selectedUser?.category || ""
                }))
                setPages(mappedPages)
                setSelectedPageIds(mappedPages.map(p => p.id))
                setStatus(`${mappedPages.length} pages identified for ingestion.`)
                toast.success(`Discovered ${mappedPages.length} assets`)
            } catch {
                toast.error("Asset discovery failed")
                setStatus("Discovery failed. Check token permissions.")
            } finally {
                setLoadingPages(false)
            }
        }
        void fetchPages()
    }, [selectedSystemUserId, isAdminVerified, selectedUser?.token, selectedUser?.category, selectedUser?.name])

    const handlePageSave = async () => {
        const selectedPages = pages.filter((p) => selectedPageIds.includes(p.id))
        if (selectedPages.length === 0) return

        try {
            setSaving(true)
            setStatus("Ingesting verified tokens into registry...")
            const payload = selectedPages.map((page) => ({
                pageId: page.id,
                name: page.name,
                source: "System User",
                systemUserId: selectedUser?.id ?? "",
                systemUserName: selectedUser?.name ?? "",
                appName: selectedUser?.appName ?? "",
                category: page.category ?? "",
                topic: selectedUser?.category || "",
                token: page.access_token,
            }))

            const res = await fetch("/api/database/saveToken", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error("Registry update failed")

            toast.success(`Registered ${selectedPages.length} core assets`)
            setStatus(`Ingestion finalized: ${selectedPages.length} tokens committed.`)
            setSelectedPageIds([])
        } catch {
            toast.error("Registry commit failed")
        } finally {
            setSaving(false)
        }
    }

    const handleSelectThird = (part: 1 | 2 | 3) => {
        const total = pages.length
        if (total === 0) return

        const third = Math.ceil(total / 3)
        let start = 0
        let end = third

        if (part === 2) {
            start = third
            end = Math.min(Math.ceil(2 * total / 3), total)
        } else if (part === 3) {
            start = Math.ceil(2 * total / 3)
            end = total
        }

        const slice = pages.slice(start, end).map(p => p.id)
        setSelectedPageIds(slice)
        toast.info(`Selected part ${part}/3 (${slice.length} items)`)
    }

    return {
        status, systemUsers, selectedBmFilter, setSelectedBmFilter,
        selectedSystemUserId, setSelectedSystemUserId, pages, setPages,
        selectedPageIds, setSelectedPageIds, saving, loadingPages, loadingUsers,
        bmFilterOptions, filteredSystemUsers, selectedUser, activePart,
        handlePageSave, handleSelectThird
    }
}

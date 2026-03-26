import { useState, useCallback, useEffect, useMemo } from "react"
import { toast } from "sonner"
import { facebookService } from "@/services/facebook.service"
import { FacebookPage, SystemUser } from "@/types/facebook"

export function useFacebookDiscovery(adminPassword: string, isAdminVerified: boolean) {
    const [status, setStatus] = useState("Select identity to discover assets.")
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
    const [selectedSystemUserId, setSelectedSystemUserId] = useState("")
    const [pages, setPages] = useState<FacebookPage[]>([])
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const [loadingPages, setLoadingPages] = useState(false)

    const selectedUser = useMemo(() => systemUsers.find((u) => u.id === selectedSystemUserId), [systemUsers, selectedSystemUserId])

    const loadSystemUsers = useCallback(async (password: string) => {
        try {
            const res = await fetch("/api/database/systemUsers/secure-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Failed to load personnel")
            setSystemUsers(data.data ?? [])
        } catch {
            toast.error("Cloud sync failed")
        }
    }, [])

    useEffect(() => {
        if (!isAdminVerified || !adminPassword.trim()) {
            setSystemUsers([])
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
                setStatus("Crawling page assets...")
                const fetchedPages = await facebookService.getPages(token)
                const mappedPages = fetchedPages.map(p => ({
                    ...p,
                    topic: selectedUser?.category || ""
                }))
                setPages(mappedPages)
                setSelectedPageIds([])
                setStatus(`${fetchedPages.length} pages ready for ingestion.`)
                toast.success(`Discovered ${fetchedPages.length} assets`)
            } catch {
                toast.error("Asset discovery failed")
                setStatus("Discovery failed. Check identity permissions.")
            } finally {
                setLoadingPages(false)
            }
        }
        void fetchPages()
    }, [selectedSystemUserId, isAdminVerified, selectedUser?.token, selectedUser?.category])

    const handlePageSave = async () => {
        const selectedPages = pages.filter((p) => selectedPageIds.includes(p.id))
        if (selectedPages.length === 0) return

        try {
            setSaving(true)
            setStatus("Ingesting tokens...")
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

            if (!res.ok) throw new Error("Ingestion failed")

            toast.success(`Registered ${selectedPages.length} assets`)
            setStatus(`Ingestion complete: ${selectedPages.length} tokens stored.`)
            setSelectedPageIds([])
        } catch {
            toast.error("Token storage failed")
        } finally {
            setSaving(false)
        }
    }

    const handleCopy = useCallback(async (text: string, label: string) => {
        await navigator.clipboard.writeText(text)
        toast.success(`Copied ${label}`)
    }, [])

    return {
        status, systemUsers, selectedSystemUserId, setSelectedSystemUserId,
        pages, selectedPageIds, setSelectedPageIds, saving, loadingPages,
        selectedUser, handlePageSave, handleCopy
    }
}

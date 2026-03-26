import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { SystemUser } from "@/types/facebook"
import { facebookService } from "@/services/facebook.service"

export function useSystemUserManagement(adminPassword: string, isAdminVerified: boolean) {
    const [status, setStatus] = useState("Authenticated. Awaiting personnel query.")
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
    const [crawlToken, setCrawlToken] = useState("")
    const [crawling, setCrawling] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedBmFilter, setSelectedBmFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [recrawlingIds, setRecrawlingIds] = useState<Set<string>>(new Set())
    const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null)

    const loadSystemUsers = useCallback(async (password: string) => {
        try {
            const res = await fetch("/api/database/systemUsers/secure-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Cloud sync failed")
            setSystemUsers(data.data ?? [])
        } catch {
            toast.error("Identity sync failed")
        }
    }, [])

    useEffect(() => {
        if (!isAdminVerified || !adminPassword.trim()) {
            setSystemUsers([])
            return
        }
        void loadSystemUsers(adminPassword.trim())
    }, [isAdminVerified, adminPassword, loadSystemUsers])

    const handleCrawl = async () => {
        if (!crawlToken.trim()) return
        try {
            setCrawling(true)
            setStatus("Establishing Graph API handshake...")
            const me = await facebookService.getMe(crawlToken)
            const businesses = await facebookService.getBusinesses(crawlToken)
            
            const nameParts = me.name.split("-").map(p => p.trim())
            let roleCode = ""
            let role = "Admin"
            let businessName = businesses[0]?.name || ""
            let note = ""

            if (nameParts.length >= 1) {
                roleCode = nameParts[0]
                if (roleCode.toUpperCase() === "EM") role = "Employee"
                else if (roleCode.toUpperCase() === "AD") role = "Admin"
            }
            if (nameParts.length >= 2) {
                businessName = nameParts[1]
            }
            if (nameParts.length >= 3) {
                const rawNote = nameParts[2]
                const expansionMap: Record<string, string> = {
                    "NB": "NBA", "ML": "MLB", "NH": "NHL", "NF": "NFL",
                    "Mu": "Music", "Mus": "Music", "Musi": "Music",
                    "Mo": "Movie", "Mov": "Movie", "Movi": "Movie"
                }

                note = rawNote.split(",")
                    .map(p => {
                        const part = p.trim().replace(/\s*\d+$/, "")
                        return expansionMap[part] || part
                    })
                    .filter((v, i, a) => v && a.indexOf(v) === i)
                    .join(", ")
            }

            const userData: SystemUser = {
                id: me.id,
                name: me.name,
                token: crawlToken,
                role: role,
                roleCode: roleCode,
                businessId: businesses[0]?.id || "",
                businessName: businessName,
                category: note,
                appName: "Managed Asset",
                updatedAt: new Date(),
                status: "Active"
            }

            setSystemUsers(prev => {
                const filtered = prev.filter(u => u.id !== userData.id)
                return [userData, ...filtered]
            })
            
            toast.success(`Identity established: ${me.name}`)
            setStatus("Identity node active. Ready for registration.")
            setCrawlToken("")
        } catch {
            toast.error("Handshake failed. Validate token.")
        } finally {
            setCrawling(false)
        }
    }

    const handleSave = async (user: SystemUser) => {
        try {
            setSaving(true)
            const res = await fetch("/api/database/systemUsers/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPassword, user }),
            })
            if (!res.ok) throw new Error("Registry failed")
            toast.success("Identity permanently registered")
            void loadSystemUsers(adminPassword)
        } catch {
            toast.error("Cloud storage failed")
        } finally {
            setSaving(false)
        }
    }

    const handleRecrawl = async (userId: string) => {
        try {
            setRecrawlingIds(prev => new Set(prev).add(userId))
            setStatus(`Re-synchronizing identity ${userId}...`)
            const res = await fetch("/api/database/systemUsers/recrawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPassword, id: userId }),
            })
            if (!res.ok) throw new Error("Sync failed")
            toast.success("Identity synchronized with cloud")
            void loadSystemUsers(adminPassword)
        } catch {
            toast.error("Cloud re-sync failed")
            void loadSystemUsers(adminPassword)
        } finally {
            setRecrawlingIds(prev => {
                const next = new Set(prev)
                next.delete(userId)
                return next
            })
        }
    }

    const handleDelete = (user: SystemUser) => {
        setDeletingUser(user)
    }

    const confirmDelete = async () => {
        if (!deletingUser) return
        try {
            setSaving(true)
            const res = await fetch("/api/database/systemUsers/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPassword, id: deletingUser.id }),
            })
            if (!res.ok) throw new Error("Termination failed")
            toast.success("Identity purged from registry")
            setSystemUsers(prev => prev.filter(u => u.id !== deletingUser.id))
        } catch {
            toast.error("Cloud purge failed")
        } finally {
            setSaving(false)
            setDeletingUser(null)
        }
    }

    const bmFilterOptions = useMemo(() => {
        const seen = new Set<string>()
        return systemUsers
            .map((u) => ({ id: (u.businessId ?? "").trim(), name: (u.businessName ?? "—").trim() || "—" }))
            .filter((bm) => bm.id && !seen.has(bm.id) && seen.add(bm.id))
    }, [systemUsers])

    const filteredUsers = useMemo(() => {
        return systemUsers.filter(u => {
            const matchesBm = selectedBmFilter === "all" || (u.businessId ?? "").trim() === selectedBmFilter
            const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
            return matchesBm && matchesSearch
        })
    }, [systemUsers, selectedBmFilter, search])

    return {
        status, setStatus, systemUsers, crawlToken, setCrawlToken, crawling, saving,
        selectedBmFilter, setSelectedBmFilter, search, setSearch, recrawlingIds,
        deletingUser, setDeletingUser, handleCrawl, handleSave, handleRecrawl,
        handleDelete, confirmDelete, bmFilterOptions, filteredUsers
    }
}

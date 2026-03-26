import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { facebookService } from "@/services/facebook.service"
import { SystemUser } from "@/types/facebook"

export function useSystemUserHub(adminPassword: string, isAdminVerified: boolean) {
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [status, setStatus] = useState("Identity registry active.")
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [crawling, setCrawling] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedBmFilter, setSelectedBmFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [recrawlingIds, setRecrawlingIds] = useState<Set<string>>(new Set())
    const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null)
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)

    const [addForm, setAddForm] = useState({
        token: "",
        businessId: "",
        businessName: "",
        appName: "",
        category: "",
        name: "",
        id: "",
        lastSyncedToken: "",
        role: "Admin" as "Admin" | "Employee",
        roleCode: ""
    })

    const [editForm, setEditForm] = useState({
        name: "",
        token: "",
        businessId: "",
        businessName: "",
        appName: "",
        category: ""
    })
    const [initialEditForm, setInitialEditForm] = useState<typeof editForm | null>(null)

    const loadSystemUsers = useCallback(async (password: string) => {
        if (!password.trim()) return
        try {
            setLoadingUsers(true)
            const res = await fetch("/api/database/systemUsers/secure-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Cloud sync failed")
            setSystemUsers(data.data ?? [])
        } catch (err) {
            console.error("Load users error:", err)
            toast.error("Personnel registry sync failed")
        } finally {
            setLoadingUsers(false)
        }
    }, [])

    useEffect(() => {
        if (!isAdminVerified || !adminPassword.trim()) {
            setSystemUsers([])
            return
        }
        void loadSystemUsers(adminPassword.trim())
    }, [isAdminVerified, adminPassword, loadSystemUsers])

    const handleCrawl = useCallback(async () => {
        if (!addForm.token.trim()) return
        try {
            setCrawling(true)
            setStatus("Establishing secure handshake with Graph API...")
            const me = await facebookService.getMe(addForm.token)
            const businesses = await facebookService.getBusinesses(addForm.token)

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
            if (nameParts.length >= 2) businessName = nameParts[1]
            if (nameParts.length >= 3) {
                const expansionMap: Record<string, string> = {
                    "NB": "NBA", "ML": "MLB", "NH": "NHL", "NF": "NFL",
                    "Mu": "Music", "Mus": "Music", "Musi": "Music",
                    "Mo": "Movie", "Mov": "Movie", "Movi": "Movie"
                }
                note = nameParts[2].split(",")
                    .map(p => {
                        const part = p.trim().replace(/\s*\d+$/, "")
                        return expansionMap[part] || part
                    })
                    .filter((v, i, a) => v && a.indexOf(v) === i)
                    .join(", ")
            }

            setAddForm(prev => ({
                ...prev,
                name: me.name,
                id: me.id,
                businessId: businesses[0]?.id || prev.businessId || "",
                businessName: businessName,
                role: role as "Admin" | "Employee",
                roleCode: roleCode,
                appName: prev.appName ? prev.appName.charAt(0).toUpperCase() + prev.appName.slice(1) : "Managed Asset",
                category: note || prev.category,
                lastSyncedToken: addForm.token
            }))

            toast.success(`Identity verified: ${me.name}`)
            setStatus("Identity synchronized. Ready for database commit.")
        } catch (err) {
            console.error("Crawl error:", err)
            toast.error("Handshake failed. Check token validity.")
        } finally {
            setCrawling(false)
        }
    }, [addForm.token])

    useEffect(() => {
        if (addForm.token.length > 30 && !crawling && addForm.token !== addForm.lastSyncedToken) {
            const timer = setTimeout(() => { void handleCrawl() }, 500)
            return () => clearTimeout(timer)
        }
    }, [addForm.token, crawling, addForm.lastSyncedToken, handleCrawl])

    const handleSave = async (user: SystemUser) => {
        try {
            setSaving(true)
            const res = await fetch("/api/database/systemUsers/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: user.id, changes: user }),
            })
            if (!res.ok) throw new Error("Registry commit failed")
            toast.success("Identity permanently committed to registry")
            void loadSystemUsers(adminPassword)
            return true
        } catch (err) {
            console.error("Save error:", err)
            toast.error("Cloud storage commit failed")
            return false
        } finally {
            setSaving(false)
        }
    }

    const handleRecrawl = async (user: SystemUser) => {
        if (!user.token) return
        try {
            setRecrawlingIds(prev => new Set(prev).add(user.id))
            setStatus(`Re-synchronizing integrity for ${user.name}...`)
            const res = await fetch("/api/database/systemUsers/recrawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPassword, id: user.id }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || "Sync failed")
            }
            toast.success("Identity integrity re-verified")
            void loadSystemUsers(adminPassword)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Cloud re-sync failed"
            toast.error(message)
            void loadSystemUsers(adminPassword)
        } finally {
            setRecrawlingIds(prev => {
                const next = new Set(prev)
                next.delete(user.id)
                return next
            })
        }
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
            toast.success("Identity terminated")
            setSystemUsers(prev => prev.filter(u => u.id !== deletingUser.id))
        } catch {
            toast.error("Command failed")
        } finally {
            setSaving(false)
            setDeletingUser(null)
        }
    }

    const handleEditStart = (user: SystemUser) => {
        setEditingUser(user)
        const formData = {
            name: user.name,
            token: user.token || "",
            businessId: user.businessId || "",
            businessName: user.businessName || "",
            appName: user.appName ? user.appName.charAt(0).toUpperCase() + user.appName.slice(1) : "",
            category: user.category || ""
        }
        setEditForm(formData)
        setInitialEditForm(formData)
    }

    const handleEditSave = async () => {
        if (!editingUser || !initialEditForm) return
        try {
            setSaving(true)
            const allowedKeys = ["token", "appName", "category"] as const
            const changes: Record<string, unknown> = {}
            allowedKeys.forEach((key) => {
                if (editForm[key] !== initialEditForm[key]) {
                    changes[key] = editForm[key]
                }
            })

            if (Object.keys(changes).length === 0) {
                setEditingUser(null)
                return
            }
            
            const res = await fetch("/api/database/systemUsers/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingUser.id, changes }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.message || "Update failed")
            
            toast.success("Identity synchronized successfully")
            setEditingUser(null)
            void loadSystemUsers(adminPassword)
        } catch (err) {
            console.error("Edit save error:", err)
            const message = err instanceof Error ? err.message : "Cloud update failed"
            toast.error(message)
        } finally {
            setSaving(false)
        }
    }

    const bmFilterOptions = useMemo(() => {
        const seen = new Set<string>()
        return systemUsers
            .map((u) => ({ id: (u.businessId ?? "").trim(), name: (u.businessName ?? "—").trim() || "—" }))
            .filter((bm) => bm.id && !seen.has(bm.id) && seen.add(bm.id))
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [systemUsers])

    const filteredUsers = useMemo(() => systemUsers.filter(u => {
        const matchesBm = selectedBmFilter === "all" || (u.businessId ?? "").trim() === selectedBmFilter
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
        return matchesBm && matchesSearch
    }), [systemUsers, selectedBmFilter, search])

    return {
        isSheetOpen, setIsSheetOpen, status, systemUsers, loadingUsers,
        crawling, saving, selectedBmFilter, setSelectedBmFilter,
        search, setSearch, recrawlingIds, deletingUser, setDeletingUser,
        editingUser, setEditingUser, addForm, setAddForm, editForm, setEditForm,
        loadSystemUsers, handleCrawl, handleSave, handleRecrawl, confirmDelete,
        handleEditStart, handleEditSave, bmFilterOptions, filteredUsers
    }
}

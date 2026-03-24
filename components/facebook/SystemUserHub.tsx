'use client'

import { useCallback, useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
    Copy,
    Loader2,
    RefreshCcw,
    Trash2,
    UserPlus,
    ShieldCheck,
    Briefcase,
    Users,
    Search,
    Database,
    Check,
    Activity,
    Key,
    Box,
    Tag
} from "lucide-react"
import { SystemUser } from "@/types/facebook"
import { facebookService } from "@/services/facebook.service"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function SystemUserHub({ adminPassword, isAdminVerified }: Props) {
    // UI state
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [status, setStatus] = useState("Identity registry active.")
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])

    // Add form state
    const [addForm, setAddForm] = useState({
        token: "",
        businessId: "",
        businessName: "",
        appName: "",
        category: "",
        name: "",
        id: "",
        lastSyncedToken: "",
        role: "admin",
        roleCode: ""
    })

    const [crawling, setCrawling] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedBmFilter, setSelectedBmFilter] = useState("all")
    const [search, setSearch] = useState("")
    const [recrawlingIds, setRecrawlingIds] = useState<Set<string>>(new Set())

    // Edit state
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [loadingUsers, setLoadingUsers] = useState(false)
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
        } catch (err: unknown) {
            console.error("Load users error:", err)
            toast.error("Personnel registry sync failed")
        } finally {
            setLoadingUsers(false)
        }
    }, [])

    const handleCrawl = useCallback(async () => {
        if (!addForm.token.trim()) return
        try {
            setCrawling(true)
            setStatus("Establishing secure handshake with Graph API...")
            const me = await facebookService.getMe(addForm.token)
            const businesses = await facebookService.getBusinesses(addForm.token)

            // Parse name: Code Role - Tên BM - Note
            const nameParts = me.name.split("-").map(p => p.trim())
            let roleCode = ""
            let role: "admin" | "employee" = "admin"
            let businessName = businesses[0]?.name || ""
            let note = ""

            if (nameParts.length >= 1) {
                roleCode = nameParts[0]
                if (roleCode.toUpperCase() === "EM") role = "employee"
                else if (roleCode.toUpperCase() === "AD") role = "admin"
            }
            if (nameParts.length >= 2) {
                businessName = nameParts[1]
            }
            if (nameParts.length >= 3) {
                note = nameParts[2]
            }

            setAddForm(prev => ({
                ...prev,
                name: me.name,
                id: me.id,
                businessId: businesses[0]?.id || prev.businessId || "",
                businessName: businessName,
                role: role,
                roleCode: roleCode,
                category: note || prev.category,
                lastSyncedToken: addForm.token
            }))

            toast.success(`Identity verified: ${me.name}`)
            setStatus("Identity synchronized. Ready for database commit.")
        } catch (err: unknown) {
            console.error("Crawl error:", err)
            toast.error("Handshake failed. Check token validity.")
        } finally {
            setCrawling(false)
        }
    }, [addForm])

    // Auto-crawl effect
    useEffect(() => {
        if (addForm.token.length > 30 && !crawling && addForm.token !== addForm.lastSyncedToken) {
            const timer = setTimeout(() => {
                void handleCrawl()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [addForm.token, crawling, addForm.lastSyncedToken, handleCrawl])

    useEffect(() => {
        if (!isAdminVerified || !adminPassword.trim()) {
            setSystemUsers([])
            return
        }
        void loadSystemUsers(adminPassword.trim())
    }, [isAdminVerified, adminPassword, loadSystemUsers])

    const handleSave = async (user: SystemUser) => {
        try {
            setSaving(true)
            const res = await fetch("/api/database/systemUsers/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    id: user.id, 
                    changes: user 
                }),
            })
            if (!res.ok) throw new Error("Registry commit failed")
            toast.success("Identity permanently committed to registry")
            void loadSystemUsers(adminPassword)
        } catch (err: unknown) {
            console.error("Save error:", err)
            toast.error("Cloud storage commit failed")
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
            if (!res.ok) throw new Error("Sync failed")
            toast.success("Identity integrity re-verified")
            void loadSystemUsers(adminPassword)
        } catch {
            toast.error("Cloud re-sync failed")
        } finally {
            setRecrawlingIds(prev => {
                const next = new Set(prev)
                next.delete(user.id)
                return next
            })
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Permanently terminate this identity? This action is irreversible.")) return
        try {
            const res = await fetch("/api/database/systemUsers/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPassword, id: userId }),
            })
            if (!res.ok) throw new Error("Termination failed")
            toast.success("Identity terminated")
            setSystemUsers(prev => prev.filter(u => u.id !== userId))
        } catch {
            toast.error("Command failed")
        }
    }

    const handleEditStart = (user: SystemUser) => {
        setEditingUser(user)
        const formData = {
            name: user.name,
            token: user.token || "",
            businessId: user.businessId || "",
            businessName: user.businessName || "",
            appName: user.appName || "",
            category: user.category || ""
        }
        setEditForm(formData)
        setInitialEditForm(formData)
    }

    const handleEditSave = async () => {
        if (!editingUser || !initialEditForm) return
        try {
            setSaving(true)

            // Only send allowed fields: token, appName, category
            const allowedKeys = ["token", "appName", "category"] as const
            const changes: Record<string, unknown> = {}
            allowedKeys.forEach((key) => {
                const k = key as keyof typeof editForm
                if (editForm[k] !== initialEditForm[k]) {
                    changes[key] = editForm[k]
                }
            })

            if (Object.keys(changes).length === 0) {
                setEditingUser(null)
                return
            }

            console.log("Submitting focused update for user:", editingUser.id, changes)
            
            const res = await fetch("/api/database/systemUsers/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingUser.id, changes }),
            })
            const result = await res.json()
            console.log("API response result:", result)
            if (!res.ok) throw new Error(result.message || "Update failed")
            
            toast.success("Identity synchronized successfully")
            setEditingUser(null)
            void loadSystemUsers(adminPassword)
        } catch (err: unknown) {
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

    const filteredUsers = systemUsers.filter(u => {
        const matchesBm = selectedBmFilter === "all" || (u.businessId ?? "").trim() === selectedBmFilter
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
        return matchesBm && matchesSearch
    })

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden border-t-primary/20">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl tracking-tight">System User Control Hub</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Activity className="w-3 h-3 text-primary animate-pulse" />
                                <p className="text-[10px] font-medium text-muted-foreground tracking-widest">{status}</p>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background/50 border-primary/20 text-primary">
                        v3.0 Enterprise
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Unified Filter Hub */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by name or identity ID..."
                            className="pl-10 h-12 text-sm bg-muted/20 border-border/40 focus:bg-background/50 focus:ring-primary/20 transition-all rounded-xl"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <Select
                            value={selectedBmFilter}
                            onValueChange={setSelectedBmFilter}
                            disabled={bmFilterOptions.length === 0}
                        >
                            <SelectTrigger className="!h-12 min-w-[240px] px-4 bg-background/50 border-border/50 text-sm font-semibold rounded-xl hover:border-primary/30 transition-all">
                                <SelectValue placeholder={bmFilterOptions.length === 0 ? "No Business Data" : "All Business"} />
                            </SelectTrigger>
                            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-xl w-[var(--radix-select-trigger-width)]">
                                <SelectItem value="all" className="py-2.5 cursor-pointer">All Business</SelectItem>
                                {bmFilterOptions.map((bm: { id: string, name: string }) => (
                                    <SelectItem key={bm.id} value={bm.id} className="py-2.5 cursor-pointer">{bm.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            className={`h-12 w-12 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary transition-all shrink-0 cursor-pointer ${loadingUsers ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : ""}`}
                            onClick={() => void loadSystemUsers(adminPassword)}
                            disabled={loadingUsers}
                            title="Refresh personnel registry"
                        >
                            <RefreshCcw className={`w-4 h-4 ${loadingUsers ? "animate-spin text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : ""}`} />
                        </Button>

                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                <Button className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all whitespace-nowrap cursor-pointer">
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add System User
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="sm:max-w-[30vw] min-w-[500px] bg-card/95 backdrop-blur-3xl border-l-border/50 shadow-2xl p-0 overflow-hidden">
                                <div className="h-full flex flex-col">
                                    <SheetHeader className="p-8 border-b border-border/50 bg-muted/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                            <ShieldCheck className="w-32 h-32 rotate-12" />
                                        </div>
                                        <SheetTitle className="flex items-center gap-4 text-3xl">
                                            <div className="p-4 bg-emerald-500/10 rounded-2xl shadow-inner border border-emerald-500/20">
                                                <ShieldCheck className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black tracking-tightest">Provision Identity</span>
                                                <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em] opacity-60">System Registry v3.0</span>
                                            </div>
                                        </SheetTitle>
                                        <SheetDescription className="text-muted-foreground mt-2">
                                             Fill in the following identity details to add to the registry.
                                        </SheetDescription>
                                    </SheetHeader>
                                    <div className="px-8 flex flex-col gap-4 py-6 flex-1 overflow-y-auto">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Access Token</label>
                                                <Input
                                                    value={addForm.token}
                                                    onChange={(e) => setAddForm({ ...addForm, token: e.target.value })}
                                                    placeholder="EAAG..."
                                                    className="h-11 bg-background/50 border-border/50 focus:ring-primary/20 hover:border-primary/30 transition-all font-mono text-xs"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                 <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Business ID</label>
                                                 <Input
                                                     value={addForm.businessId}
                                                     onChange={(e) => setAddForm({ ...addForm, businessId: e.target.value })}
                                                     placeholder="123456789..."
                                                     className="h-11 bg-background/50 border-border/50 focus:ring-primary/20"
                                                 />
                                             </div>
                                             <div className="grid grid-cols-2 gap-4">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">BM Name</label>
                                                     <Input
                                                         value={addForm.businessName}
                                                         onChange={(e) => setAddForm({ ...addForm, businessName: e.target.value })}
                                                         placeholder="BM Name..."
                                                         disabled
                                                         className="h-11 bg-muted/50 border-border/50 focus:ring-primary/20"
                                                     />
                                                 </div>
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Role</label>
                                                     <Select
                                                         value={addForm.role}
                                                         onValueChange={(val) => setAddForm({ ...addForm, role: val as "admin" | "employee" })}
                                                         disabled
                                                     >
                                                         <SelectTrigger className="h-11 bg-muted/50 border-border/50">
                                                             <SelectValue placeholder="Select Role" />
                                                         </SelectTrigger>
                                                         <SelectContent>
                                                             <SelectItem value="admin">Admin (AD)</SelectItem>
                                                             <SelectItem value="employee">Employee (EM)</SelectItem>
                                                         </SelectContent>
                                                     </Select>
                                                 </div>
                                             </div>
                                             <div className="grid grid-cols-2 gap-4">
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">System User Name</label>
                                                     <Input
                                                         value={addForm.name}
                                                         disabled
                                                         placeholder="Name will be synced..."
                                                         className="h-11 bg-muted/50 border-border/50"
                                                     />
                                                 </div>
                                                 <div className="space-y-2">
                                                     <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">System User ID</label>
                                                     <Input
                                                         value={addForm.id}
                                                         disabled
                                                         placeholder="ID will be synced..."
                                                         className="h-11 bg-muted/50 border-border/50"
                                                     />
                                                 </div>
                                             </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">App</label>
                                                <Input
                                                    value={addForm.appName}
                                                    onChange={(e) => setAddForm({ ...addForm, appName: e.target.value })}
                                                     placeholder="MANAGED_IDENTITY"
                                                    className="h-11 bg-background/50 border-border/50 focus:ring-primary/20"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Category</label>
                                                <Input
                                                    value={addForm.category}
                                                    onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                                                    placeholder="Enterprise / Business"
                                                    className="h-11 bg-background/50 border-border/50 focus:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                         <div className="flex flex-col gap-3 pt-4">
                                             {/* Loading indicator if crawling */}
                                             {crawling && (
                                                 <div className="flex items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/10 transition-all animate-in fade-in slide-in-from-top-2">
                                                     <Loader2 className="w-5 h-5 animate-spin text-primary mr-3" />
                                                     <span className="text-sm font-bold text-primary">Establishing identity link...</span>
                                                 </div>
                                             )}

                                             <Button
                                                 variant="default"
                                                 onClick={() => {
                                                     if (!addForm.token) {
                                                         toast.error("Access token required")
                                                         return
                                                     }
                                                     const newUser: SystemUser = {
                                                         id: addForm.id || Math.random().toString(36).substring(7),
                                                         name: addForm.name || "New Identity",
                                                         token: addForm.token,
                                                         businessId: addForm.businessId,
                                                         businessName: addForm.businessName,
                                                         role: addForm.role,
                                                         roleCode: addForm.roleCode,
                                                         appName: addForm.appName,
                                                         category: addForm.category,
                                                         updatedAt: new Date()
                                                     }
                                                     handleSave(newUser).then(() => {
                                                         setIsSheetOpen(false)
                                                         setAddForm({
                                                             token: "",
                                                             businessId: "",
                                                             businessName: "",
                                                             appName: "",
                                                             category: "",
                                                             name: "",
                                                             id: "",
                                                             lastSyncedToken: "",
                                                             role: "admin",
                                                             roleCode: ""
                                                         })
                                                     })
                                                 }}
                                                 disabled={crawling || !addForm.token || saving}
                                                 className="w-full h-12 font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all bg-primary hover:bg-primary/90"
                                             >
                                                 {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                                 {saving ? "Provisioning..." : "Confirm & Register Identity"}
                                             </Button>
                                         </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>

                {/* Personnel Registry Table */}
                <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden shadow-inner">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Asset ID</TableHead>
                                <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Asset Identity</TableHead>
                                <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Category</TableHead>
                                <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">App</TableHead>
                                <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Update</TableHead>
                                <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Briefcase className="w-12 h-12" />
                                            <div className="space-y-1">
                                                <p className="text-sm tracking-widest text-foreground/70">Personnel Registry Offline</p>
                                                 <p className="text-[10px] text-muted-foreground/50">Provision a new identity to activate registry.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow 
                                        key={user.id} 
                                        className="group border-border/30 hover:bg-muted/30 transition-all duration-300 cursor-pointer"
                                        onClick={() => handleEditStart(user)}
                                    >
                                        <TableCell className="py-5 px-6">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-foreground w-[140px] truncate">{user.id}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigator.clipboard.writeText(user.id)
                                                        toast.success("Identity ID copied")
                                                    }}
                                                    className="h-6 w-6 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors shrink-0"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <span className="text-sm text-foreground tracking-tight group-hover:text-primary transition-colors">{user.name}</span>
                                        </TableCell>
                                        <TableCell className="py-5 px-6">
                                            <span className="text-sm text-foreground tracking-tight">
                                                {user.category || "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-left">
                                            <span className="text-sm text-foreground tracking-tight">
                                                {user.appName || "Standard Core"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-left">
                                            <span className="text-sm text-foreground tracking-tight">
                                                {user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                }).replace(" at ", " ") : "—"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5 px-6 text-left">
                                            <div className="flex items-center justify-start gap-2" onClick={e => e.stopPropagation()}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        navigator.clipboard.writeText(user.token || "")
                                                        toast.success("Access Token copied")
                                                    }}
                                                    className="h-9 w-9 text-slate-500 hover:bg-slate-500/10 border border-slate-500/20 hover:border-slate-500/50 transition-all cursor-pointer"
                                                    title="Copy Token"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className={`h-9 w-9 text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50 transition-all cursor-pointer ${recrawlingIds.has(user.id) ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.2)] opacity-100" : ""}`}
                                                     onClick={(e) => { e.stopPropagation(); handleRecrawl(user) }}
                                                     title="Recrawl"
                                                     disabled={recrawlingIds.has(user.id)}
                                                 >
                                                     <RefreshCcw className={`w-4 h-4 ${recrawlingIds.has(user.id) ? "animate-spin text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : ""}`} />
                                                 </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-9 w-9 text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/50 transition-all cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(user.id) }}
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Edit Identity Sheet */}
                <Sheet open={!!editingUser} onOpenChange={(open: boolean) => !open && setEditingUser(null)}>
                    <SheetContent side="right" className="sm:max-w-[30vw] min-w-[500px] bg-card/95 backdrop-blur-3xl border-l-border/50 shadow-2xl p-0 overflow-hidden">
                        <div className="h-full flex flex-col">
                            <SheetHeader className="p-8 border-b border-border/50 bg-muted/20 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <Database className="w-32 h-32 -rotate-12" />
                                </div>
                                <SheetTitle className="flex items-center gap-4 text-3xl">
                                    <div className="p-4 bg-blue-500/10 rounded-2xl shadow-inner border border-blue-500/20">
                                        <Database className="w-8 h-8 text-blue-500" />
                                    </div>
                                     <div className="flex flex-col">
                                         <span className="font-black tracking-tightest">Modify System User</span>
                                         <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em] opacity-60">Update identity details</span>
                                     </div>
                                </SheetTitle>
                                <SheetDescription className="text-sm mt-4 opacity-70 font-medium">
                                     Synchronizing updates for identity: <span className="font-mono text-blue-500 font-black tracking-wider uppercase">{editingUser?.id}</span>
                                </SheetDescription>
                            </SheetHeader>
                            <div className="px-8 flex flex-col gap-6 py-8 flex-1 overflow-y-auto bg-background/40">
                                <div className="space-y-6">
                                    {/* Identity Overview Card */}
                                    <div className="relative group">
                                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                                        <div className="relative p-5 bg-card/80 border border-border/40 rounded-2xl space-y-4 shadow-sm">
                                            <div className="flex items-start justify-between">
                                                 <div className="space-y-1">
                                                     <p className="text-[10px] font-bold tracking-widest text-muted-foreground/60">System User Identify</p>
                                                     <h3 className="font-bold text-base text-foreground tracking-tight">{editingUser?.name}</h3>
                                                 </div>
                                                <div className="p-2 bg-primary/10 rounded-lg">
                                                    <ShieldCheck className="w-4 h-4 text-primary" />
                                                </div>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/20">
                                                <div className="space-y-1">
                                                     <p className="text-[9px] font-bold text-muted-foreground/40 tracking-tighter">Business Name</p>
                                                    <p className="text-xs font-semibold truncate">{editingUser?.businessName || "Unassigned"}</p>
                                                </div>
                                                 <div className="space-y-1">
                                                     <p className="text-[9px] font-bold text-muted-foreground/40 tracking-tighter">System User ID</p>
                                                     <p className="text-[10px] font-mono font-medium opacity-60 truncate">{editingUser?.id}</p>
                                                 </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Editable Configuration */}
                                    <div className="space-y-5 pt-2">
                                        <div className="space-y-2.5">
                                            <div className="flex items-center gap-2 ml-1">
                                                <Key className="w-3.5 h-3.5 text-primary/60" />
                                                <label className="text-xs font-bold tracking-tight text-muted-foreground">Access Token</label>
                                            </div>
                                            <Input
                                                value={editForm.token}
                                                onChange={(e) => setEditForm({ ...editForm, token: e.target.value })}
                                                className="bg-background/50 border-border/40 font-mono text-xs h-12 focus:ring-1 focus:ring-primary/20 transition-all rounded-xl"
                                                type="password"
                                                 placeholder="Enter secure access token..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-2 ml-1">
                                                    <Box className="w-3.5 h-3.5 text-blue-500/60" />
                                                    <label className="text-xs font-bold tracking-tight text-muted-foreground">App Name</label>
                                                </div>
                                                <Input
                                                    value={editForm.appName}
                                                    onChange={(e) => setEditForm({ ...editForm, appName: e.target.value })}
                                                    className="bg-background/50 border-border/40 h-12 text-sm focus:ring-1 focus:ring-primary/20 transition-all rounded-xl font-medium"
                                                    placeholder="e.g. Meta Marketing"
                                                />
                                            </div>
                                            <div className="space-y-2.5">
                                                <div className="flex items-center gap-2 ml-1">
                                                    <Tag className="w-3.5 h-3.5 text-emerald-500/60" />
                                                    <label className="text-xs font-bold tracking-tight text-muted-foreground">Category</label>
                                                </div>
                                                <Input
                                                    value={editForm.category}
                                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                    className="bg-background/50 border-border/40 h-12 text-sm focus:ring-1 focus:ring-primary/20 transition-all rounded-xl font-medium"
                                                    placeholder="Identity Tag..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <Button variant="ghost" onClick={() => setEditingUser(null)} className="flex-1 h-12 border border-border/30 rounded-xl hover:bg-muted/50 transition-colors">
                                        Cancel
                                    </Button>
                                    <Button onClick={handleEditSave} disabled={saving} className="flex-1 h-12 shadow-lg shadow-primary/20 rounded-xl">
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                        Commit Changes
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </CardContent>
        </Card>
    )
}

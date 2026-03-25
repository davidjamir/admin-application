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
  Briefcase,
  History,
  Users,
  Search,
  Database,
  AlertTriangle
} from "lucide-react"
import { SystemUser } from "@/types/facebook"
import { facebookService } from "@/services/facebook.service"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function SystemUserManager({ adminPassword, isAdminVerified }: Props) {
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
            
            // Parse name: Code Role - Tên BM - Note
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
                    "NB": "NBA",
                    "ML": "MLB",
                    "NH": "NHL",
                    "NF": "NFL",
                    "Mu": "Music",
                    "Mus": "Music",
                    "Musi": "Music",
                    "Mo": "Movie",
                    "Mov": "Movie",
                    "Movi": "Movie"
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
            // Still reload to show the "Disabled" status updated by backend
            void loadSystemUsers(adminPassword)
        } finally {
            setRecrawlingIds(prev => {
                const next = new Set(prev)
                next.delete(userId)
                return next
            })
        }
    }

    const handleDelete = async (user: SystemUser) => {
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

    const filteredUsers = systemUsers.filter(u => {
        const matchesBm = selectedBmFilter === "all" || (u.businessId ?? "").trim() === selectedBmFilter
        const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.id.includes(search)
        return matchesBm && matchesSearch
    })

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Personnel Management</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{status}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background/50">
                        System User Module v2.0
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Ingestion Controls */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-primary/50 transition-colors">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <Input 
                            value={crawlToken}
                            onChange={(e) => setCrawlToken(e.target.value)}
                            placeholder="Connect new identity token (EAAG...)"
                            className="pl-9 h-11 bg-background/50 border-border/50 focus:ring-primary/20"
                        />
                    </div>
                    <Button 
                        onClick={handleCrawl} 
                        disabled={crawling || !crawlToken.trim()}
                        className={`h-11 cursor-pointer font-bold shadow-lg shadow-primary/5 ${crawling ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : ""}`}
                    >
                        {crawling ? <Loader2 className="w-4 h-4 animate-spin mr-2 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                        {crawling ? "Establishing..." : "Sync Identity"}
                    </Button>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative w-full md:w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                         <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search Personnel..."
                            className="pl-9 h-8 text-xs bg-muted/20 border-border/40"
                         />
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto">
                        <div className="p-1 px-3 rounded-md bg-muted/30 border border-border/30">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Identity Pool:</span>
                        </div>
                        <select 
                            value={selectedBmFilter}
                            onChange={(e) => setSelectedBmFilter(e.target.value)}
                            className="h-8 rounded-md border border-border/50 bg-background/50 px-3 text-xs focus:ring-1 focus:ring-primary/20"
                        >
                            <option value="all">All Origin Identities</option>
                            {bmFilterOptions.map((bm: {id: string, name: string}) => <option key={bm.id} value={bm.id}>{bm.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Personnel Table */}
                <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-[180px] text-xs uppercase font-bold tracking-wider">Identity Name</TableHead>
                                <TableHead className="text-xs uppercase font-bold tracking-wider">Node Context</TableHead>
                                <TableHead className="text-xs uppercase font-bold tracking-wider">Status</TableHead>
                                <TableHead className="text-xs uppercase font-bold tracking-wider">Sync Integrity</TableHead>
                                <TableHead className="text-right text-xs uppercase font-bold tracking-wider pr-6">Operations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Briefcase className="w-10 h-10" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-widest text-foreground">Personnel Pool Empty</p>
                                                <p className="text-[10px] text-muted-foreground">Synchronize a new identity to begin.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="group border-border/30 hover:bg-muted/30 transition-colors">
                                        <TableCell className="py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{user.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-muted-foreground/60">{user.id}</span>
                                                    <button 
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(user.id)
                                                            toast.success("Identity ID copied")
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-primary"
                                                    >
                                                        <Copy className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-medium text-muted-foreground">{user.businessName || "Untethered Node"}</span>
                                                <span className="text-[9px] font-mono opacity-50">{user.businessId || "—"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className="text-[9px] font-medium h-4 border-border/40 text-muted-foreground bg-muted/10">
                                                {user.appName ? user.appName.charAt(0).toUpperCase() + user.appName.slice(1) : "Standard Asset"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge 
                                                variant="outline" 
                                                className={`text-[9px] font-bold uppercase tracking-wider h-5 px-2 border-none ${
                                                    user.status === "Disabled" 
                                                    ? "bg-red-500/10 text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.2)]" 
                                                    : "bg-emerald-500/10 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                                                }`}
                                            >
                                                {user.status || "Active"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${user.status === "Disabled" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"}`} />
                                                <span className={`text-[10px] font-bold uppercase ${user.status === "Disabled" ? "text-red-600/80" : "text-emerald-600/80"}`}>
                                                    {user.status === "Disabled" ? "Sync Lost" : "Active Sync"}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 pr-6 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary cursor-pointer"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(user.token || "")
                                                        toast.success("Auth Token copied")
                                                    }}
                                                    title="Copy Token"
                                                >
                                                    <History className="w-3.5 h-3.5" />
                                                </Button>
                                                 <Button 
                                                     size="icon" 
                                                     variant="ghost" 
                                                     className={`h-8 w-8 hover:bg-primary/10 hover:text-primary cursor-pointer ${recrawlingIds.has(user.id) ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.2)] opacity-100" : ""}`}
                                                     onClick={() => handleRecrawl(user.id)}
                                                     title="Re-synchronize"
                                                     disabled={recrawlingIds.has(user.id)}
                                                 >
                                                     <RefreshCcw className={`w-3.5 h-3.5 ${recrawlingIds.has(user.id) ? "animate-spin text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : ""}`} />
                                                 </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
                                                    onClick={() => handleSave(user)}
                                                    disabled={saving}
                                                    title="Flash to Cloud"
                                                >
                                                    <Database className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                    onClick={() => handleDelete(user)}
                                                    title="Terminate Identity"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>

            {/* Custom Delete Confirmation Dialog */}
            <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
                <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-2xl border-border/50 shadow-2xl p-0 overflow-hidden rounded-2xl">
                    <div className="p-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                            </div>
                            <div className="space-y-1">
                                <DialogTitle className="text-xl font-bold tracking-tight">Terminate Identity</DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground/70">
                                    Requested via management console
                                </DialogDescription>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-4">
                            <div className="flex flex-col items-center gap-2 pb-3 border-b border-red-500/10">
                                <p className="text-[10px] font-black uppercase text-red-500/40 tracking-[0.2em] leading-none">Target Identity</p>
                                <div className="flex flex-col items-center gap-1.5">
                                    <span className="text-xs font-mono font-bold text-red-600/80 leading-none tracking-tight">{deletingUser?.id}</span>
                                    <span className="text-sm font-bold text-foreground/90 leading-none">{deletingUser?.name}</span>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-red-600/90 leading-relaxed text-center">
                                Permanently terminate this identity?<br/>
                                <span className="text-[11px] opacity-70 font-normal">This action is irreversible.</span>
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-muted/20 border-t border-border/50 gap-2 sm:gap-0">
                        <Button 
                            variant="ghost" 
                            onClick={() => setDeletingUser(null)}
                            className="flex-1 h-11 rounded-xl border border-border/30 hover:bg-muted/50 transition-all font-semibold cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={confirmDelete}
                            disabled={saving}
                            className={`flex-1 h-11 rounded-xl transition-all font-bold cursor-pointer border ${
                                saving 
                                ? "bg-red-600 border-transparent text-white shadow-lg shadow-red-500/20" 
                                : "bg-background border-red-500/30 text-red-500 hover:bg-red-500/5 hover:border-red-500/50"
                            }`}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2 text-white" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            {saving ? "Purging..." : "Terminate"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

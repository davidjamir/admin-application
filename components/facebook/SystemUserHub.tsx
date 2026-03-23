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
  History,
  Users,
  Search,
  Database,
  Edit,
  Check,
  X,
  Activity
} from "lucide-react"
import { SystemUser } from "@/types/facebook"
import { facebookService } from "@/services/facebook.service"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function SystemUserHub({ adminPassword, isAdminVerified }: Props) {
    const [status, setStatus] = useState("Identity node pool active.")
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
    const [crawlToken, setCrawlToken] = useState("")
    const [crawling, setCrawling] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedBmFilter, setSelectedBmFilter] = useState("all")
    const [search, setSearch] = useState("")
    
    // Edit state
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [editForm, setEditForm] = useState({ name: "", token: "" })

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
        } catch (err) {
            toast.error("Personnel registry sync failed")
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
            setStatus("Establishing secure handshake with Graph API...")
            const me = await facebookService.getMe(crawlToken)
            const businesses = await facebookService.getBusinesses(crawlToken)
            
            const userData: SystemUser = {
                id: me.id,
                name: me.name,
                token: crawlToken,
                role: "admin",
                businessId: businesses[0]?.id || "",
                businessName: businesses[0]?.name || "",
                appName: "MANAGED_NODE",
                updatedAt: new Date()
            }

            // Preview in table before saving to DB
            setSystemUsers(prev => {
                const filtered = prev.filter(u => u.id !== userData.id)
                return [userData, ...filtered]
            })
            
            toast.success(`Identity verified: ${me.name}`)
            setStatus("Node synchronized. Ready for database commit.")
            setCrawlToken("")
        } catch (err) {
            toast.error("Handshake failed. Check token validity.")
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
            if (!res.ok) throw new Error("Registry commit failed")
            toast.success("Identity permanently committed to registry")
            void loadSystemUsers(adminPassword)
        } catch (err) {
            toast.error("Cloud storage commit failed")
        } finally {
            setSaving(false)
        }
    }

    const handleRecrawl = async (user: SystemUser) => {
        if (!user.token) return
        try {
            setStatus(`Re-synchronizing integrity for ${user.name}...`)
            const res = await fetch("/api/database/systemUsers/recrawl", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPassword, id: user.id }),
            })
            if (!res.ok) throw new Error("Sync failed")
            toast.success("Identity integrity re-verified")
            void loadSystemUsers(adminPassword)
        } catch (err) {
            toast.error("Cloud re-sync failed")
        }
    }

    const handleDelete = async (userId: string) => {
        if (!confirm("Permanently terminate this identity node? This action is irreversible.")) return
        try {
            const res = await fetch("/api/database/systemUsers/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPassword, id: userId }),
            })
            if (!res.ok) throw new Error("Termination failed")
            toast.success("Identity node terminated")
            setSystemUsers(prev => prev.filter(u => u.id !== userId))
        } catch (err) {
            toast.error("Command failed")
        }
    }

    const handleEditStart = (user: SystemUser) => {
        setEditingUser(user)
        setEditForm({ name: user.name, token: user.token || "" })
    }

    const handleEditSave = async () => {
        if (!editingUser) return
        try {
            setSaving(true)
            const updatedUser = { ...editingUser, ...editForm, updatedAt: new Date() }
            const res = await fetch("/api/database/systemUsers/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: adminPassword, user: updatedUser }),
            })
            if (!res.ok) throw new Error("Update failed")
            toast.success("Identity updated successfully")
            setEditingUser(null)
            void loadSystemUsers(adminPassword)
        } catch (err) {
            toast.error("Cloud update failed")
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
                {/* Node Provisioning */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-primary transition-colors">
                            <UserPlus className="w-4 h-4" />
                        </div>
                        <Input 
                            value={crawlToken}
                            onChange={(e) => setCrawlToken(e.target.value)}
                            placeholder="Provision new identity token (EAAG...)"
                            className="pl-10 h-12 bg-background/50 border-border/50 focus:ring-primary/20 hover:border-primary/30 transition-all shadow-inner"
                        />
                    </div>
                    <Button 
                        onClick={handleCrawl} 
                        disabled={crawling || !crawlToken.trim()}
                        className="h-12 px-8 cursor-pointer font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                    >
                        {crawling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                        {crawling ? "Verifying..." : "Sync Identity"}
                    </Button>
                </div>

                {/* Pool Orchestration */}
                <div className="flex flex-wrap items-center gap-4 py-2">
                    <div className="relative w-full md:w-80">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                         <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Filter personnel registry..."
                            className="pl-10 h-10 text-xs bg-muted/20 border-border/40 focus:bg-background/50 transition-all"
                         />
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <Badge variant="secondary" className="h-10 px-4 rounded-lg bg-muted/40 border-border/50 text-[10px] font-bold tracking-widest text-muted-foreground">
                            Origin Node:
                        </Badge>
                        <select 
                            value={selectedBmFilter}
                            onChange={(e) => setSelectedBmFilter(e.target.value)}
                            className="h-10 rounded-lg border border-border/50 bg-background/50 px-4 text-xs font-semibold focus:ring-2 focus:ring-primary/20 hover:border-primary/30 transition-all cursor-pointer"
                        >
                            <option value="all">Global Registry (All BMs)</option>
                            {bmFilterOptions.map((bm: {id: string, name: string}) => <option key={bm.id} value={bm.id}>{bm.name}</option>)}
                        </select>
                    </div>
                </div>

                {/* Personnel Registry Table */}
                <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden shadow-inner">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-[220px] text-[10px] font-bold tracking-widest text-muted-foreground py-4 px-6">Identity Name</TableHead>
                                <TableHead className="text-[10px] font-bold tracking-widest text-muted-foreground">Node Context</TableHead>
                                <TableHead className="text-[10px] font-bold tracking-widest text-muted-foreground">App Origin</TableHead>
                                <TableHead className="text-[10px] font-bold tracking-widest text-muted-foreground text-center">Integrity</TableHead>
                                <TableHead className="text-right text-[10px] font-bold tracking-widest text-muted-foreground pr-8">Operations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Briefcase className="w-12 h-12" />
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold tracking-widest text-foreground">Personnel Registry Offline</p>
                                                <p className="text-[10px] text-muted-foreground">Provision a new identity node to activate registry.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="group border-border/30 hover:bg-muted/30 transition-all duration-300">
                                        <TableCell className="py-5 px-6">
                                            <div className="flex flex-col gap-1">
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
                                        <TableCell className="py-5">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-semibold text-muted-foreground">{user.businessName || "Untethered Node"}</span>
                                                <span className="text-[9px] font-mono opacity-50 tracking-wider">ID: {user.businessId || "—"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge variant="outline" className="text-[9px] font-bold h-5 border-border/40 text-muted-foreground bg-muted/20">
                                                {user.appName || "Standard Core"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                <span className="text-[10px] font-bold text-emerald-600/80">Synced</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 pr-8 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={() => handleEditStart(user)}
                                                    title="Modify Node"
                                                >
                                                    <Edit className="w-4 h-4 opacity-50" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={() => handleRecrawl(user)}
                                                    title="Verify Integrity"
                                                >
                                                    <RefreshCcw className="w-4 h-4 opacity-50" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-9 w-9 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                                                    onClick={() => handleSave(user)}
                                                    disabled={saving}
                                                    title="Commit to Registry"
                                                >
                                                    <Database className="w-4 h-4 opacity-50" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors"
                                                    onClick={() => handleDelete(user.id)}
                                                    title="Terminate Node"
                                                >
                                                    <Trash2 className="w-4 h-4 opacity-50" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Edit Identity Dialog */}
                <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/50 shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Edit className="w-5 h-5 text-primary" />
                                <span>Reconfigure Identity Node</span>
                            </DialogTitle>
                            <DialogDescription className="text-xs">
                                Update the metadata for identity node: <span className="font-mono text-primary font-bold">{editingUser?.id}</span>
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-muted-foreground ml-1">Identity Display Name</label>
                                <Input 
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className="bg-background/50 border-border/50 h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold tracking-widest text-muted-foreground ml-1">Access Token Endpoint</label>
                                <Input 
                                    value={editForm.token}
                                    onChange={(e) => setEditForm({ ...editForm, token: e.target.value })}
                                    className="bg-background/50 border-border/50 font-mono text-xs h-11"
                                    type="password"
                                />
                                <p className="text-[9px] text-muted-foreground italic px-1">Warning: Changing the token may break active asset connections.</p>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="ghost" onClick={() => setEditingUser(null)} className="h-11">
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                            </Button>
                            <Button onClick={handleEditSave} disabled={saving} className="h-11 shadow-lg shadow-primary/20">
                                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                Commit Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

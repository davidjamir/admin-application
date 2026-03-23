'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Copy, 
  Loader2, 
  Key, 
  Search, 
  Database,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { facebookService } from "@/services/facebook.service"
import { FacebookPage, SystemUser } from "@/types/facebook"
import { cn } from "@/lib/utils"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function FacebookLogin({ adminPassword, isAdminVerified }: Props) {
    const [status, setStatus] = useState("Select identity to discover assets.")
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>([])
    const [selectedBmFilter, setSelectedBmFilter] = useState("all")
    const [selectedSystemUserId, setSelectedSystemUserId] = useState("")
    const [pages, setPages] = useState<FacebookPage[]>([])
    const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
    const [saving, setSaving] = useState(false)
    const [loadingPages, setLoadingPages] = useState(false)

    const bmFilterOptions = useMemo(() => {
        const seen = new Set<string>()
        return systemUsers
            .map((u) => ({ id: (u.businessId ?? "").trim(), name: (u.businessName ?? "—").trim() || "—" }))
            .filter((bm) => bm.id && !seen.has(bm.id) && seen.add(bm.id))
    }, [systemUsers])

    const filteredSystemUsers = useMemo(() => {
        if (selectedBmFilter === "all") return systemUsers
        return systemUsers.filter((u) => (u.businessId ?? "").trim() === selectedBmFilter)
    }, [systemUsers, selectedBmFilter])

    const selectedUser = systemUsers.find((u) => u.id === selectedSystemUserId)

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
        } catch (err) {
            toast.error("Cloud sync failed")
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
                setStatus("Crawling page assets...")
                const fetchedPages = await facebookService.getPages(token)
                setPages(fetchedPages)
                setSelectedPageIds([])
                setStatus(`${fetchedPages.length} pages ready for ingestion.`)
                toast.success(`Discovered ${fetchedPages.length} assets`)
            } catch (err: unknown) {
                toast.error("Asset discovery failed")
                setStatus("Discovery failed. Check identity permissions.")
            } finally {
                setLoadingPages(false)
            }
        }
        void fetchPages()
    }, [selectedSystemUserId, isAdminVerified])

    const isAllSelected = pages.length > 0 && pages.every((p) => selectedPageIds.includes(p.id))

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
        } catch (err: unknown) {
            toast.error("Token storage failed")
        } finally {
            setSaving(false)
        }
    }

    const handleCopy = async (text: string, label: string) => {
        await navigator.clipboard.writeText(text)
        toast.success(`Copied ${label}`)
    }

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Token Ingestion Manager</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{status}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background/50">
                        Ingestion Module v2.0
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {/* Discovery Controls */}
                <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_160px] gap-3">
                    <Select value={selectedSystemUserId} onValueChange={setSelectedSystemUserId} disabled={!isAdminVerified || systemUsers.length === 0}>
                        <SelectTrigger className="h-10 bg-background/50 border-border/50">
                            <SelectValue placeholder="Select Identity..." />
                        </SelectTrigger>
                        <SelectContent>
                            {systemUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    <div className="flex flex-col items-start py-0.5">
                                        <span className="text-xs font-bold">{user.name}</span>
                                        <span className="text-[9px] text-muted-foreground font-mono opacity-60">
                                            {user.businessName || "Unknown BM"}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="relative group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-primary/50 transition-colors">
                            <Search className="w-4 h-4" />
                        </div>
                        <div className="pl-9 pr-4 py-2 text-xs font-medium text-muted-foreground border border-border/50 rounded-md bg-muted/20 flex items-center h-10 italic">
                            {selectedUser ? `${selectedUser.name} identity active for discovery` : "Await identity selection..."}
                        </div>
                    </div>

                    <Button 
                        onClick={handlePageSave} 
                        disabled={!isAdminVerified || saving || loadingPages || pages.length === 0 || selectedPageIds.length === 0}
                        className="w-full h-10 cursor-pointer shadow-lg shadow-primary/5"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                        {saving ? "Ingesting..." : "Ingest Tokens"}
                    </Button>
                </div>

                {/* Asset Explorer Table */}
                <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-12 text-center py-3">
                                    <Checkbox 
                                        checked={isAllSelected}
                                        onCheckedChange={(checked) => {
                                            if (checked) setSelectedPageIds(pages.map(p => p.id))
                                            else setSelectedPageIds([])
                                        }}
                                        disabled={pages.length === 0}
                                        className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                    />
                                </TableHead>
                                <TableHead className="text-xs uppercase font-bold tracking-wider">Page Architecture</TableHead>
                                <TableHead className="text-xs uppercase font-bold tracking-wider">Category</TableHead>
                                <TableHead className="text-xs uppercase font-bold tracking-wider">Token Health</TableHead>
                                <TableHead className="text-right text-xs uppercase font-bold tracking-wider pr-6">Operations</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingPages ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} className="py-8 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground opacity-20" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : pages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30">
                                            <Layers className="w-10 h-10" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold uppercase tracking-widest text-foreground">Discovery Required</p>
                                                <p className="text-[10px] text-muted-foreground">Select an active identity to crawl linked page assets.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pages.map((page) => (
                                    <TableRow 
                                        key={page.id} 
                                        className={cn(
                                            "group border-border/30 transition-colors",
                                            selectedPageIds.includes(page.id) ? "bg-primary/5 border-primary/20" : "hover:bg-muted/30"
                                        )}
                                        onClick={() => {
                                            const isChecked = selectedPageIds.includes(page.id)
                                            setSelectedPageIds(prev => isChecked ? prev.filter(id => id !== page.id) : [...prev, page.id])
                                        }}
                                    >
                                        <TableCell className="text-center py-3" onClick={e => e.stopPropagation()}>
                                            <Checkbox 
                                                checked={selectedPageIds.includes(page.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedPageIds(prev => checked ? [...prev, page.id] : prev.filter(id => id !== page.id))
                                                }}
                                                className="border-border/60"
                                            />
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{page.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-muted-foreground/60">{page.id}</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handleCopy(page.id, "Page ID") }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-primary"
                                                    >
                                                        <Copy className="w-2.5 h-2.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className="text-[9px] font-medium h-4 border-border/40 text-muted-foreground bg-muted/10">
                                                {page.category || "General"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                                <span className="text-[10px] font-bold text-emerald-600/80 uppercase">Active</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 pr-6 text-right" onClick={e => e.stopPropagation()}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleCopy(page.access_token, "Page Token")}
                                                className="h-7 text-[10px] px-2 font-mono border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all"
                                            >
                                                <Copy className="w-3 h-3 mr-1.5" />
                                                EP...{page.access_token.slice(-6)}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

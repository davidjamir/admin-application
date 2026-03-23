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
    Layers,
    Briefcase,
    Activity,
    RefreshCcw,
    Database,
    Trash2
} from "lucide-react"
import { facebookService } from "@/services/facebook.service"
import { FacebookPage, SystemUser } from "@/types/facebook"
import { cn } from "@/lib/utils"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function TokenIngestion({ adminPassword, isAdminVerified }: Props) {
    const [status, setStatus] = useState("Select Business Manager to begin discovery.")
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
            .sort((a, b) => a.name.localeCompare(b.name))
    }, [systemUsers])

    const filteredSystemUsers = useMemo(() => {
        if (selectedBmFilter === "all") return systemUsers
        return systemUsers.filter((u) => (u.businessId ?? "").trim() === selectedBmFilter)
    }, [systemUsers, selectedBmFilter])

    const selectedUser = systemUsers.find((u) => u.id === selectedSystemUserId)

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
            const res = await fetch("/api/database/systemUsers/secure-list", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.message || "Failed to load personnel")
            setSystemUsers(data.data ?? [])
        } catch (err) {
            toast.error("Identity sync failed")
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

    // Load pages when system user is selected
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
                setPages(fetchedPages)
                setSelectedPageIds(fetchedPages.map(p => p.id))
                setStatus(`${fetchedPages.length} pages identified for ingestion.`)
                toast.success(`Discovered ${fetchedPages.length} assets`)
            } catch (err: unknown) {
                toast.error("Asset discovery failed")
                setStatus("Discovery failed. Check token permissions.")
            } finally {
                setLoadingPages(false)
            }
        }
        void fetchPages()
    }, [selectedSystemUserId, isAdminVerified, selectedUser])

    const isAllSelected = pages.length > 0 && pages.every((p) => selectedPageIds.includes(p.id))

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
        } catch (err: unknown) {
            toast.error("Registry commit failed")
        } finally {
            setSaving(false)
        }
    }

    const handleCopy = async (text: string, label: string) => {
        await navigator.clipboard.writeText(text)
        toast.success(`Copied ${label}`)
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

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden border-t-primary/20">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl tracking-tight">Token Ingestion Hub</CardTitle>
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
                {/* Discovery Pipeline */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Left Group: Selectors */}
                    <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
                        <div className="w-full md:w-72 shrink-0">
                            <Select value={selectedBmFilter} onValueChange={(v) => {
                                setSelectedBmFilter(v)
                                setSelectedSystemUserId("") // Reset user on BM change
                            }} disabled={loadingPages || bmFilterOptions.length === 0}>
                                <SelectTrigger className="!h-12 w-full bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium text-sm rounded-xl">
                                    <SelectValue placeholder="All Business" />
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 w-[var(--radix-select-trigger-width)] max-h-[300px]">
                                    <SelectItem value="all" className="font-semibold text-sm py-2.5 cursor-pointer">All Business</SelectItem>
                                    {bmFilterOptions.map((bm) => (
                                        <SelectItem key={bm.id} value={bm.id} className="text-sm py-2.5 cursor-pointer">
                                            <div className="flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 opacity-50 text-sky-500" />
                                                <span className="truncate">{bm.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-[480px] shrink-0">
                            <Select
                                value={selectedSystemUserId}
                                onValueChange={setSelectedSystemUserId}
                                disabled={loadingPages || filteredSystemUsers.length === 0}
                            >
                                <SelectTrigger className="!h-12 w-full bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium text-sm rounded-xl">
                                    <SelectValue placeholder="Select System User" />
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 w-[var(--radix-select-trigger-width)] max-h-[300px]">
                                    {filteredSystemUsers.map((user) => (
                                        <SelectItem key={user.id} value={user.id} className="text-sm py-2.5 cursor-pointer">
                                            <span className="truncate">
                                                {user.name} • {user.appName || "Standard"} • {user.id}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Right Group: Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        <Button
                            variant="outline"
                            size="icon"
                            disabled={!selectedSystemUserId || loadingPages}
                            onClick={() => {
                                // Trigger re-fetch
                                setSelectedSystemUserId("")
                                setTimeout(() => setSelectedSystemUserId(selectedSystemUserId), 10)
                            }}
                            className={cn(
                                "!h-12 !w-12 shrink-0 rounded-xl transition-all group border",
                                loadingPages
                                    ? "border-green-500 text-green-500"
                                    : "border-border/50 hover:border-green-500 text-muted-foreground hover:text-green-500 cursor-pointer"
                            )}
                        >
                            <RefreshCcw className={cn("w-4 h-4 transition-colors", !loadingPages && "opacity-50 group-hover:opacity-100", loadingPages && "animate-spin")} />
                        </Button>

                        <Button
                            onClick={handlePageSave}
                            disabled={!isAdminVerified || saving || loadingPages || (pages.length > 0 && selectedPageIds.length === 0)}
                            className={cn(
                                "!h-12 px-6 font-bold transition-all rounded-xl shadow-sm border text-sm",
                                (pages.length > 0 && selectedPageIds.length > 0)
                                    ? "bg-blue-500 border-blue-500 text-white shadow-md hover:bg-blue-600 cursor-pointer"
                                    : (pages.length > 0)
                                        ? "bg-white border-blue-50 text-black border-2"
                                        : "bg-white text-gray-400",
                                "disabled:opacity-90 disabled:cursor-not-allowed"
                            )}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Database className="w-4 h-4 mr-2" />}
                            {saving ? "Saving..." : "Ingest Tokens"}
                        </Button>
                    </div>
                </div>

                {/* Selection Indicator & Shortcuts */}
                {pages.length > 0 && !loadingPages && (
                    <div className="flex items-center justify-between px-1 py-1">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-sm font-medium text-primary tracking-wide">
                                {selectedPageIds.length} items selected for ingestion
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-muted-foreground/50 mr-1 capitalize tracking-tighter">Shortcuts:</span>
                            {[1, 2, 3].map((part) => (
                                <Button
                                    key={part}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSelectThird(part as 1 | 2 | 3)}
                                    className={cn(
                                        "h-7 px-2.5 text-[10px] font-bold transition-all rounded-lg cursor-pointer",
                                        activePart === part
                                            ? "border-green-600 text-green-600 bg-green-50"
                                            : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
                                    )}
                                >
                                    {part}/3
                                </Button>
                            ))}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedPageIds([])
                                    toast.info("Cleared selection")
                                }}
                                className="h-7 px-1.5 text-muted-foreground cursor-pointer border-red-600 text-red-600 hover:text-red-600 hover:bg-red-600/10 transition-all rounded-lg ml-0.5"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear
                            </Button>
                        </div>
                    </div>
                )}

                {/* Registry Staging Area */}
                <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden shadow-inner">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-14 text-center py-4">
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
                                <TableHead className="text-left text-sm font-bold tracking-widest text-muted-foreground">Asset ID</TableHead>
                                <TableHead className="text-left text-sm font-bold tracking-widest text-muted-foreground">Asset Identify</TableHead>
                                <TableHead className="text-left text-sm font-bold tracking-widest text-muted-foreground">Category</TableHead>
                                <TableHead className="text-left text-sm font-bold tracking-widest text-muted-foreground">Access Token</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingPages ? (
                                Array.from({ length: 1 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={5} className="py-10 text-center">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary/20" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : pages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-24 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <Layers className="w-12 h-12" />
                                            <div className="space-y-1">
                                                <p className="text-xs font-bold tracking-widest text-foreground">Registry Awaiting Discovery</p>
                                                <p className="text-[10px] text-muted-foreground">Validate an identity node to stage assets for ingestion.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pages.map((page) => (
                                    <TableRow
                                        key={page.id}
                                        className={cn(
                                            "group border-border/30 transition-all duration-300 cursor-pointer",
                                            selectedPageIds.includes(page.id) ? "bg-primary/[0.02] border-primary/10" : "hover:bg-muted/30"
                                        )}
                                        onClick={() => {
                                            const isChecked = selectedPageIds.includes(page.id)
                                            setSelectedPageIds(prev => isChecked ? prev.filter(id => id !== page.id) : [...prev, page.id])
                                        }}
                                    >
                                        <TableCell className="text-center py-4" onClick={e => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selectedPageIds.includes(page.id)}
                                                onCheckedChange={(checked) => {
                                                    setSelectedPageIds(prev => checked ? [...prev, page.id] : prev.filter(id => id !== page.id))
                                                }}
                                                className="border-border/60"
                                            />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center justify-between gap-4 max-w-[180px]">
                                                <span className="text-sm font-mono text-muted-foreground/60">{page.id}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => { e.stopPropagation(); handleCopy(page.id, "Asset ID") }}
                                                    className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className="font-bold text-sm leading-tight group-hover:text-primary transition-colors">{page.name}</span>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="outline" className="text-sm font-medium h-6 border-border/40 text-muted-foreground bg-muted/20 tracking-tighter">
                                                {page.category || "General"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4" onClick={e => e.stopPropagation()}>
                                            <div className="flex items-center justify-between gap-4 max-w-[200px]">
                                                <span className="text-sm font-mono text-muted-foreground/60">
                                                    {page.access_token.slice(0, 4)}...{page.access_token.slice(-8)}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleCopy(page.access_token, "Access Token")}
                                                    className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                                >
                                                    <Copy className="w-3 h-3" />
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
        </Card>
    )
}

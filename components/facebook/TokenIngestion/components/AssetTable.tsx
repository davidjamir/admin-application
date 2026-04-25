import React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Copy, Layers, Loader2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { AssetTableProps } from "./types"

export const AssetTable: React.FC<AssetTableProps> = ({
    pages, selectedPageIds, setSelectedPageIds, loadingPages, activePart, handleSelectThird,
    trafficInterval, viralInterval
}) => {
    const isAllSelected = pages.length > 0 && pages.every((p) => selectedPageIds.includes(p.id))

    const handleCopy = async (text: string, label: string) => {
        await navigator.clipboard.writeText(text)
        toast.success(`Copied ${label}`)
    }

    return (
        <div className="space-y-4">
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
                        <span className="text-[10px] font-bold text-muted-foreground/50 mr-1 capitalize tracking-tighter text-black">Shortcuts:</span>
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
                            className="h-7 px-1.5 text-muted-foreground cursor-pointer border border-red-600 text-red-600 hover:text-red-600 hover:bg-red-600/10 transition-all rounded-lg ml-0.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            {/* Registry Staging Area */}
            <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden shadow-inner text-black">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="text-center text-xs font-extrabold tracking-wider text-black w-10 py-4">#</TableHead>
                        <TableHead className="text-left text-xs font-extrabold tracking-wider text-black py-4 w-[140px]">Asset ID</TableHead>
                        <TableHead className="text-left text-xs font-extrabold tracking-wider text-black py-4 min-w-[220px]">Asset Identity</TableHead>
                        <TableHead className="text-center text-xs font-extrabold tracking-wider text-black py-4 w-[80px]">Traffic</TableHead>
                        <TableHead className="text-center text-xs font-extrabold tracking-wider text-black py-4 w-[80px]">Viral</TableHead>
                        <TableHead className="text-left text-xs font-extrabold tracking-wider text-black py-4 w-[130px]">Category</TableHead>
                        <TableHead className="text-left text-xs font-extrabold tracking-wider text-black py-4 w-[130px]">Topic</TableHead>
                        <TableHead className="text-left text-xs font-extrabold tracking-wider text-black py-4 w-[130px]">Access Token</TableHead>
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loadingPages ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-10 text-center">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary/20" />
                                </TableCell>
                            </TableRow>
                        ) : pages.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-24 text-center">
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
                            pages.map((page, idx) => (
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
                                <TableCell className="text-center py-4 text-sm text-black tracking-tight w-10">
                                    {idx + 1}
                                </TableCell>
                                <TableCell className="py-4 w-[140px]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-mono text-black">{page.id}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={(e) => { e.stopPropagation(); handleCopy(page.id, "Asset ID") }}
                                            className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                        >
                                            <Copy className="w-3 h-3 text-black" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="py-4 min-w-[220px]">
                                    <span className="text-sm font-normal leading-tight text-black truncate block max-w-[300px]" title={page.name}>
                                        {page.name}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4 w-[80px] text-center">
                                    <span className="text-sm font-mono text-black">{trafficInterval}m</span>
                                </TableCell>
                                <TableCell className="py-4 w-[80px] text-center">
                                    <span className="text-sm font-mono text-black">{viralInterval}m</span>
                                </TableCell>
                                <TableCell className="py-4 w-[130px]">
                                    <span className="text-sm font-normal text-black truncate block" title={page.category || "-"}>
                                        {page.category || "-"}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4 w-[130px]">
                                    <span className="text-sm font-normal text-black truncate block" title={page.topic || "-"}>
                                        {page.topic || "-"}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4 w-[130px]" onClick={e => e.stopPropagation()}>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-mono text-black">
                                            {(page.access_token || "").slice(0, 4)}...{(page.access_token || "").slice(-4)}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCopy(page.access_token || "", "Access Token")}
                                            className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer"
                                        >
                                            <Copy className="w-3 h-3 text-black" />
                                        </Button>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center py-4" onClick={e => e.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedPageIds.includes(page.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedPageIds(prev => checked ? [...prev, page.id] : prev.filter(id => id !== page.id))
                                        }}
                                        className="border-border/60"
                                    />
                                </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

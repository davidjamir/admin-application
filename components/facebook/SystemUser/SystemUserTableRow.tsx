import React from "react"
import { Copy, RefreshCcw, Trash2 } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SystemUserTableRowProps } from "./types"

export const SystemUserTableRow: React.FC<SystemUserTableRowProps> = ({
    user, isRecrawling, onRecrawl, onDelete, onEdit
}) => {
    return (
        <TableRow 
            className="group border-border/30 hover:bg-muted/30 transition-all duration-300 cursor-pointer"
            onClick={() => onEdit(user)}
        >
            <TableCell className="py-5 px-6">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-black w-[140px] truncate">{user.id}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(user.id)
                            toast.success("Identity ID copied")
                        }}
                        className="h-6 w-6 text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors shrink-0 cursor-pointer"
                    >
                        <Copy className="w-3 h-3" />
                    </Button>
                </div>
            </TableCell>
            <TableCell className="py-5 px-6">
                <span className="text-sm text-black tracking-tight group-hover:text-primary transition-colors">{user.name}</span>
            </TableCell>
            <TableCell className="py-5 px-6 shrink-0">
                <Badge 
                    variant="outline" 
                    className={`text-[9px] font-bold h-5 px-2 border ${
                        user.status === "Disabled" 
                        ? "bg-red-500/5 text-red-500 border-red-500/20" 
                        : "bg-emerald-500/5 text-emerald-500 border-emerald-500/20"
                    }`}
                >
                    {user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1).toLowerCase() : "Active"}
                </Badge>
            </TableCell>
            <TableCell className="py-5 px-6 text-left">
                <span className="text-sm text-black tracking-tight">
                    {user.category || "—"}
                </span>
            </TableCell>
            <TableCell className="py-5 px-6 text-left">
                <span className="text-sm text-black tracking-tight">
                    {user.appName ? user.appName.charAt(0).toUpperCase() + user.appName.slice(1) : "Standard Core"}
                </span>
            </TableCell>
            <TableCell className="py-5 px-6 text-left">
                <span className="text-sm text-black tracking-tight">
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-US', {
                        month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    }).replace(" at ", " ") : "—"}
                </span>
            </TableCell>
            <TableCell className="py-5 px-6 text-left">
                <div className="flex items-center justify-start gap-2" onClick={e => e.stopPropagation()}>
                    <Button
                        variant="ghost" size="icon"
                        onClick={(e) => {
                            e.stopPropagation()
                            navigator.clipboard.writeText(user.token || "")
                            toast.success("Access Token copied")
                        }}
                        className="h-9 w-9 text-slate-500 hover:bg-slate-500/10 border border-slate-500/20 hover:border-slate-500/50 transition-all cursor-pointer"
                    >
                        <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                        size="icon" variant="ghost"
                        className={`h-9 w-9 text-green-600 hover:bg-green-600/10 border border-green-600/20 hover:border-green-600/50 transition-all cursor-pointer ${isRecrawling ? "border-green-600/50 bg-green-600/5 shadow-[0_0_10px_rgba(22,163,74,0.2)] opacity-100" : ""}`}
                        onClick={(e) => { e.stopPropagation(); onRecrawl(user) }}
                        disabled={isRecrawling}
                    >
                        <RefreshCcw className={`w-4 h-4 ${isRecrawling ? "animate-spin text-green-600" : ""}`} />
                    </Button>
                    <Button
                        size="icon" variant="ghost"
                        className="h-9 w-9 text-red-500 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/50 transition-all cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onDelete(user) }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    )
}

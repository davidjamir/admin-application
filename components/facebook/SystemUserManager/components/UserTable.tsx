import React from "react"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Briefcase,
    Copy,
    Database,
    History,
    RefreshCcw, 
    Search,
    Trash2
} from "lucide-react"
import { toast } from "sonner"
import { UserTableProps } from "./types"

export const UserTable: React.FC<UserTableProps> = ({
    users, search, setSearch, selectedBmFilter, setSelectedBmFilter,
    bmFilterOptions, recrawlingIds, saving, handleRecrawl, handleSave, handleDelete
}) => {
    return (
        <div className="space-y-6">
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
                        {bmFilterOptions.map((bm) => <option key={bm.id} value={bm.id}>{bm.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Personnel Table */}
            <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden text-black">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-[180px] text-xs uppercase font-bold tracking-wider text-black">Identity Name</TableHead>
                            <TableHead className="text-xs uppercase font-bold tracking-wider text-black">Node Context</TableHead>
                            <TableHead className="text-xs uppercase font-bold tracking-wider text-black">Status</TableHead>
                            <TableHead className="text-xs uppercase font-bold tracking-wider text-black">Sync Integrity</TableHead>
                            <TableHead className="text-right text-xs uppercase font-bold tracking-wider pr-6 text-black">Operations</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 ? (
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
                            users.map((user) => (
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
                                                <History className="w-3.5 h-3.5 text-black" />
                                            </Button>
                                             <Button 
                                                 size="icon" 
                                                 variant="ghost" 
                                                 className={`h-8 w-8 hover:bg-primary/10 hover:text-primary cursor-pointer ${recrawlingIds.has(user.id) ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.2)] opacity-100" : ""}`}
                                                 onClick={() => handleRecrawl(user.id)}
                                                 title="Re-synchronize"
                                                 disabled={recrawlingIds.has(user.id)}
                                             >
                                                 <RefreshCcw className={`w-3.5 h-3.5 ${recrawlingIds.has(user.id) ? "animate-spin text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "text-black"}`} />
                                             </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 hover:bg-emerald-500/10 hover:text-emerald-500 cursor-pointer"
                                                onClick={() => handleSave(user)}
                                                disabled={saving}
                                                title="Flash to Cloud"
                                            >
                                                <Database className="w-3.5 h-3.5 text-black" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                                onClick={() => handleDelete(user)}
                                                title="Terminate Identity"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 text-black" />
                                            </Button>
                                        </div>
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

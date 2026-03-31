import React, { useState, useMemo } from "react"
import { BookOpen, ChevronsUpDown, ChevronUp, ChevronDown, CheckCircle2, PauseCircle } from "lucide-react"
import { Blog } from "@/hooks/useWebsiteManager"
import { SortableTH } from "./SortableTH"
import { BlogsTableProps } from "./types"

const fmtFull = (ms: number) =>
    new Date(ms).toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "medium"
    })

export const BlogsTable: React.FC<BlogsTableProps> = ({ blogs, selectedId, onSelect }) => {
    const [sortKey, setSortKey] = useState("blogDns")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

    const toggleSort = (k: string) => {
        if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortKey(k); setSortDir("asc") }
    }

    const sortIcon = ({ col }: { col: string }) => {
        if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
        return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    }

    const sorted = useMemo(() => [...blogs].sort((a, b) => {
        const av = a[sortKey as keyof Blog], bv = b[sortKey as keyof Blog]
        if (av === undefined || bv === undefined) return 0
        if (av < bv) return sortDir === "asc" ? -1 : 1
        if (av > bv) return sortDir === "asc" ? 1 : -1
        return 0
    }), [blogs, sortKey, sortDir])

    return (
        <div className="rounded-lg border border-border bg-card overflow-x-auto mt-3">
            <table className="w-full text-sm table-fixed min-w-[1120px]">
                <thead><tr className="border-b bg-muted/40 text-black">
                    <th className="px-4 py-3 font-semibold text-left w-[50px]">#</th>
                    <SortableTH label="DNS" col="blogDns" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[250px]" />
                    <SortableTH label="Channel" col="channel" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[120px]" />
                    <SortableTH label="User" col="blogUser" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[200px]" />
                    <SortableTH label="Priority" col="blogPriority" align="center" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[150px]" />
                    <SortableTH label="Status" col="enabled" align="center" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[150px]" />
                    <SortableTH label="Updated" col="updatedAt" align="center" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[200px]" />
                </tr></thead>
                <tbody>
                    {sorted.length === 0 ? (
                        <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-25" /><p>No blogs found</p></td></tr>
                    ) : sorted.map((b, i) => (
                        <tr key={b._id} onClick={() => onSelect({ tab: "blogs", data: b })}
                            className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${selectedId === b._id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                            <td className="px-4 py-4 font-mono text-black w-[50px]">{i + 1}</td>
                            <td className="px-4 py-4 font-mono truncate text-black w-[250px]">{b.blogDns}</td>
                            <td className="px-4 py-4 text-black truncate w-[120px]">{b.channel || ""}</td>
                            <td className="px-4 py-4 truncate text-black w-[200px]">{b.blogUser}</td>
                            <td className="px-4 py-4 text-center w-[150px] text-black">{b.blogPriority}</td>
                            <td className="px-4 py-4 text-center w-[150px] text-black">{b.enabled
                                ? <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium"><CheckCircle2 className="w-3 h-3" /> Enabled</span>
                                : <span className="inline-flex items-center gap-1.5 text-rose-500 font-medium"><PauseCircle className="w-3 h-3" /> Disabled</span>}</td>
                            <td className="px-4 py-4 text-center w-[200px] italic tabular-nums text-black truncate">{fmtFull(b.updatedAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

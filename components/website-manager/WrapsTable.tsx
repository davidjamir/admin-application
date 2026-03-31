import React, { useState, useMemo } from "react"
import { Link2, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react"
import { Wrap } from "@/hooks/useWebsiteManager"
import { SortableTH } from "./SortableTH"
import { WrapsTableProps } from "./types"

const fmtFull = (ms: number) =>
    new Date(ms).toLocaleString("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        dateStyle: "medium",
        timeStyle: "medium"
    })

export const WrapsTable: React.FC<WrapsTableProps> = ({ wraps, selectedId, onSelect }) => {
    const [sortKey, setSortKey] = useState("wrap_host")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

    const toggleSort = (k: string) => {
        if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortKey(k); setSortDir("asc") }
    }

    const sortIcon = ({ col }: { col: string }) => {
        if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
        return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    }

    const sorted = useMemo(() => [...wraps].sort((a, b) => {
        const av = a[sortKey as keyof Wrap], bv = b[sortKey as keyof Wrap]
        if (av === undefined || bv === undefined) return 0
        if (av < bv) return sortDir === "asc" ? -1 : 1
        if (av > bv) return sortDir === "asc" ? 1 : -1
        return 0
    }), [wraps, sortKey, sortDir])

    return (
        <div className="rounded-lg border border-border bg-card overflow-x-auto mt-3">
            <table className="w-full text-sm table-fixed min-w-[1150px]">
                <thead><tr className="border-b bg-muted/40 text-black">
                    <th className="px-4 py-3 font-semibold text-left w-[50px]">#</th>
                    <SortableTH label="Wrap Host" col="wrap_host" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[350px]" />
                    <SortableTH label="Prefix" col="prefix" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[150px]" />
                    <SortableTH label="Target Host" col="target_host" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[350px]" />
                    <SortableTH label="Updated" col="updatedAt" align="center" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[250px]" />
                </tr></thead>
                <tbody>
                    {sorted.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground"><Link2 className="w-8 h-8 mx-auto mb-2 opacity-25" /><p>No wraps found</p></td></tr>
                    ) : sorted.map((w, i) => (
                        <tr key={w._id} onClick={() => onSelect({ tab: "wraps", data: w })}
                            className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${selectedId === w._id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                            <td className="px-4 py-4 font-mono text-black w-[50px]">{i + 1}</td>
                            <td className="px-4 py-4 font-mono text-black w-[350px]">{w.wrap_host}</td>
                            <td className="px-4 py-4 w-[150px]"><span className="px-2 py-0.5 rounded-full border border-green-600 text-green-600 font-mono text-sm">{w.prefix}</span></td>
                            <td className="px-4 py-4 text-black font-mono w-[350px]">{w.target_host}</td>
                            <td className="px-4 py-4 text-center text-black italic w-[250px]">{fmtFull(w.updatedAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

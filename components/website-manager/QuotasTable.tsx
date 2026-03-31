import React, { useState, useMemo } from "react"
import { BarChart3, ChevronsUpDown, ChevronUp, ChevronDown } from "lucide-react"
import { QuotaGroup } from "@/hooks/useWebsiteManager"
import { SortableTH } from "./SortableTH"
import { QuotasTableProps } from "./types"

export const QuotasTable: React.FC<QuotasTableProps> = ({ quotas, selectedId, onSelect }) => {
    const [sortKey, setSortKey] = useState("domain")
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

    const toggleSort = (k: string) => {
        if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc")
        else { setSortKey(k); setSortDir("asc") }
    }

    const sortIcon = ({ col }: { col: string }) => {
        if (sortKey !== col) return <ChevronsUpDown className="w-3 h-3 opacity-30" />
        return sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
    }

    const sorted = useMemo(() => [...quotas].sort((a, b) => {
        let av: number | string, bv: number | string
        if (sortKey === "count") { av = a.latest.count; bv = b.latest.count }
        else if (sortKey === "limit") { av = a.latest.limit; bv = b.latest.limit }
        else if (sortKey === "usage") {
            av = a.latest.limit > 0 ? a.latest.count / a.latest.limit : 0
            bv = b.latest.limit > 0 ? b.latest.count / b.latest.limit : 0
        }
        else if (sortKey === "date") { av = a.latest.date; bv = b.latest.date }
        else {
            av = a[sortKey as keyof QuotaGroup] as string | number;
            bv = b[sortKey as keyof QuotaGroup] as string | number
        }

        if (av < bv) return sortDir === "asc" ? -1 : 1
        if (av > bv) return sortDir === "asc" ? 1 : -1
        return 0
    }), [quotas, sortKey, sortDir])

    return (
        <div className="rounded-xl border border-border/40 bg-card overflow-x-auto shadow-sm mt-3">
            <table className="w-full text-xs table-fixed min-w-[1120px]">
                <thead><tr className="border-b bg-muted/40">
                    <th className="px-4 py-4 font-bold text-sm text-left w-[50px] text-black">#</th>
                    <SortableTH label="Domain" col="domain" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[350px]" />
                    <SortableTH label="Last Active" col="date" align="center" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[150px]" />
                    <SortableTH label="Posts" col="count" align="center" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[85px]" />
                    <SortableTH label="Limit" col="limit" align="center" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[85px]" />
                    <SortableTH label="Status" col="usage" align="center" sort={{ toggle: toggleSort, Icon: sortIcon, key: sortKey }} className="w-[250px]" />
                </tr></thead>
                <tbody>
                    {sorted.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground"><BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-25" /><p>No quotas found</p></td></tr>
                    ) : sorted.map((g, i) => {
                        const pct = g.latest.limit > 0 ? Math.round((g.latest.count / g.latest.limit) * 100) : 0
                        const barColor = pct >= 90 ? "bg-rose-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500"
                        return (
                            <tr key={g.domain} onClick={() => onSelect({ tab: "quotas", data: g })}
                                className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${selectedId === g.domain ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                                <td className="px-4 py-4 text-black text-sm w-[50px]">{i + 1}</td>
                                <td className="px-4 py-4 w-[350px] text-black text-sm"><div className="truncate">{g.domain}</div><div className="text-[10px] lowercase">{g.type}</div></td>
                                <td className="px-4 py-4 text-center w-[150px] text-black text-sm whitespace-nowrap">{g.latest.date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}</td>
                                <td className="px-4 py-4 text-center w-[85px] text-black text-sm tabular-nums">{g.latest.count}</td>
                                <td className="px-4 py-4 text-center text-black text-sm tabular-nums w-[85px]">{g.latest.limit}</td>
                                <td className="px-4 py-4 w-[250px]">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                        </div>
                                        <span className="text-[10px] text-black font-bold tabular-nums w-7">{pct}%</span>
                                    </div>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

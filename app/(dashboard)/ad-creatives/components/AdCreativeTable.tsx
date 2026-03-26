import React from "react"
import { 
    CheckCircle2, ChevronDown, ChevronsUpDown, ChevronUp, ImagePlay, Layers, PauseCircle 
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { AdCreativeTableProps } from "./types"

export const AdCreativeTable: React.FC<AdCreativeTableProps> = ({
  loading, sorted, selectedId, sortKey, sortDir, handleSort, onOpenDetail, totalCount
}) => {
  const getSourceStyle = (source: string) => {
    const s = (source || "").toLowerCase();
    if (s.includes("adhub")) return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
    if (s.includes("google")) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    if (s.includes("manual")) return "bg-slate-500/10 text-slate-700 dark:text-slate-400";
    if (s.includes("fallback")) return "bg-rose-500/10 text-rose-700 dark:text-rose-400";
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left text-black">
        <thead>
          <tr className="border-b bg-muted/40 font-bold text-sm text-black">
            <TH label="#"        col="createdAt" sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
            <TH label="Name"     col="name"      sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} />
            <TH label="Source"   col="source"    sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} align="center" />
            <TH label="Domain"   col="domain"    sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} align="center" />
            <TH label="Priority" col="priority"  sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} align="center" />
            <TH label="Status"   col="enabled"   sortKey={sortKey} sortDir={sortDir} handleSort={handleSort} align="center" />
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-5"><Skeleton className="h-4 w-4" /></td>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j} className="px-4 py-5"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-16 text-center text-muted-foreground">
                <ImagePlay className="w-10 h-10 mx-auto mb-2 opacity-25" />
                <p>No ad creatives found</p>
              </td>
            </tr>
          ) : (
            sorted.map((item, index) => (
              <tr
                key={item._id}
                onClick={() => onOpenDetail(item)}
                className={`border-b transition-colors cursor-pointer group ${selectedId === item._id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
              >
                <td className="px-4 py-5 text-black text-sm font-normal">{index + 1}</td>
                <td className="px-4 py-5 font-normal truncate max-w-[180px] text-sm text-black capitalize">
                  {item.name}
                </td>
                <td className="px-4 py-5 text-center">
                  <span className={`px-2 py-0.5 rounded-sm text-sm font-normal lowercase ${getSourceStyle(item.source)}`}>
                    {item.source}
                  </span>
                </td>
                <td className="px-4 py-5 text-sm text-black font-normal truncate max-w-[150px] text-center">{item.domain}</td>
                <td className="px-4 py-5 text-sm font-normal text-center text-black">{item.priority}</td>
                <td className="px-4 py-5 text-center">
                  <div className="flex justify-center">
                    {item.enabled
                      ? <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-normal whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Enabled</span>
                      : <span className="flex items-center gap-1.5 text-sm text-rose-500 font-normal whitespace-nowrap"><PauseCircle className="w-3.5 h-3.5 text-rose-500" /> Disabled</span>}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {!loading && (
        <div className="px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground flex items-center justify-between italic">
          <div className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> Showing {sorted.length} of {totalCount}</div>
        </div>
      )}
    </div>
  )
}

function TH<T>({ 
  label, col, sortKey, sortDir, handleSort, align = "left" 
}: { 
  label: string; col: keyof T; sortKey: string; sortDir: string; handleSort: (k: keyof T) => void;
  align?: "left" | "center" | "right"
}) {
  const isSorted = sortKey === col
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
  const justifyClass = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"

  return (
    <th onClick={() => handleSort(col)}
      className={`px-4 py-5 ${alignClass} cursor-pointer select-none hover:bg-muted transition-colors group text-black`}>
      <span className={`flex items-center gap-1.5 ${justifyClass}`}>
        {label}
        {isSorted ? (
          sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronsUpDown className="w-3 h-3 opacity-20 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </th>
  )
}

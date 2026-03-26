import React from "react"
import { Copy } from "lucide-react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { DiscoveryTableRowProps } from "./types"

export const DiscoveryTableRow: React.FC<DiscoveryTableRowProps> = ({
  page, isSelected, onToggle, handleCopy
}) => {
  return (
    <TableRow 
      className={cn(
        "group border-border/30 transition-colors",
        isSelected ? "bg-primary/5 border-primary/20" : "hover:bg-muted/30"
      )}
      onClick={onToggle}
    >
      <TableCell className="text-center py-3" onClick={e => e.stopPropagation()}>
        <Checkbox 
          checked={isSelected}
          onCheckedChange={onToggle}
          className="border-border/60"
        />
      </TableCell>
      <TableCell className="py-3 text-left">
        <span className="text-[10px] font-medium text-black transition-colors group-hover:text-primary">{page.name}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-black">{page.id}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); handleCopy(page.id, "Page ID") }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-primary cursor-pointer"
          >
            <Copy className="w-2.5 h-2.5" />
          </button>
        </div>
      </TableCell>
      <TableCell className="py-3 text-left">
        <span className="text-[10px] font-medium text-black">
          {page.category || "-"}
        </span>
      </TableCell>
      <TableCell className="py-3 text-left">
        <span className="text-[10px] font-medium text-black">
          {page.topic || "-"}
        </span>
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
          className="h-7 text-[10px] px-2 font-mono border-border/50 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-black cursor-pointer"
        >
          <Copy className="w-3 h-3 mr-1.5" />
          EP...{page.access_token.slice(-6)}
        </Button>
      </TableCell>
    </TableRow>
  )
}

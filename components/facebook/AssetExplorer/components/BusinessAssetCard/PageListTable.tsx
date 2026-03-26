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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Layers, Lock, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { FacebookPage } from "@/types/facebook"

interface PageListTableProps {
  pages: FacebookPage[]
  assignedPageIds: string[]
  selectedPageIds: string[]
  handleToggleSelection: (id: string) => void
  handleCopy: (text: string, label: string) => void
}

export function PageListTable({
  pages, assignedPageIds, selectedPageIds, handleToggleSelection, handleCopy
}: PageListTableProps) {
  return (
    <Table>
      <TableHeader className="bg-muted/10">
        <TableRow className="hover:bg-transparent border-border/50">
          <TableHead className="text-center py-4 px-4">
             <Layers className="w-4 h-4 mx-auto text-black/40" />
          </TableHead>
          <TableHead className="text-xs font-extrabold uppercase tracking-wider text-black py-4 px-6 text-left">Page Identity</TableHead>
          <TableHead className="text-xs font-extrabold uppercase tracking-wider text-black py-4 px-6 text-left">Category</TableHead>
          <TableHead className="text-xs font-extrabold uppercase tracking-wider text-black py-4 px-6 text-left">Identity Status</TableHead>
          <TableHead className="text-right text-xs font-extrabold uppercase tracking-wider text-black py-4 pr-10">Operations</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pages.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="py-12 text-center opacity-30 italic text-sm">
              No discoverable assets in this node.
            </TableCell>
          </TableRow>
        ) : (
          pages.map((page) => (
            <TableRow 
              key={page.id} 
              className={cn(
                "group border-border/20 transition-colors h-12 cursor-pointer",
                selectedPageIds.includes(page.id) ? "bg-primary/5 border-primary/10" : "hover:bg-muted/20"
              )}
              onClick={() => handleToggleSelection(page.id)}
            >
              <TableCell className="text-center py-2" onClick={e => e.stopPropagation()}>
                 <Checkbox 
                    checked={selectedPageIds.includes(page.id)}
                    onCheckedChange={() => handleToggleSelection(page.id)}
                    className="border-border/60 cursor-pointer"
                 />
              </TableCell>
              <TableCell className="py-3">
                 <div className="flex flex-col">
                    <span className="text-sm font-bold text-black leading-none group-hover:text-primary transition-colors">{page.name}</span>
                    <span className="text-[11px] font-mono text-black/60 mt-1.5">{page.id}</span>
                 </div>
              </TableCell>
              <TableCell className="py-3">
                 <Badge variant="outline" className="text-xs py-0 px-2 h-6 border-black/10 text-black bg-black/5 font-bold">
                    {page.category || "General"}
                 </Badge>
              </TableCell>
              <TableCell className="py-3">
                 {assignedPageIds.includes(page.id) ? (
                   <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                      <span className="text-sm font-extrabold text-emerald-700">In Control</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-1.5 opacity-60">
                      <Lock className="w-3 h-3 text-black" />
                      <span className="text-sm font-bold text-black">Locked</span>
                   </div>
                 )}
              </TableCell>
              <TableCell className="py-2 text-right pr-8" onClick={e => e.stopPropagation()}>
                 <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer"
                    onClick={() => handleCopy(page.id, "Page ID")}
                 >
                    <Copy className="w-4 h-4" />
                 </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )
}

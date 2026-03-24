'use client'

import { useMemo, useState } from "react"
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
import { 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Briefcase,
  Layers,
  Lock,
  Trash2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { FacebookBusiness, FacebookPage } from "@/types/facebook"

type BusinessRow = FacebookBusiness & {
  pages: FacebookPage[]
  assignedPageIds: string[]
}

type Props = {
  business: BusinessRow
  selectedPageIds: string[]
  onSelectionChange: (ids: string[]) => void
}

export default function BusinessAssetCard({ 
  business, 
  selectedPageIds, 
  onSelectionChange
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const allIdsInBm = useMemo(() => business.pages.map(p => p.id), [business.pages])
  const selectedInBm = useMemo(() => selectedPageIds.filter(id => allIdsInBm.includes(id)), [selectedPageIds, allIdsInBm])
  const isAllSelected = allIdsInBm.length > 0 && allIdsInBm.every(id => selectedPageIds.includes(id))
  
  const activePart = useMemo(() => {
    const total = business.pages.length
    if (total === 0 || selectedInBm.length === 0) return null
    
    const third = Math.ceil(total / 3)
    const selectedSet = new Set(selectedInBm)

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
        return business.pages.slice(start, end).map(p => p.id)
    }

    for (const part of [1, 2, 3] as const) {
        const partIds = getPartIds(part)
        if (selectedInBm.length === partIds.length && partIds.every(id => selectedSet.has(id))) {
            return part
        }
    }
    return null
  }, [business.pages, selectedInBm])

  const handleToggleSelection = (id: string) => {
    onSelectionChange(
      selectedPageIds.includes(id) 
        ? selectedPageIds.filter(prevId => prevId !== id)
        : [...selectedPageIds, id]
    )
  }

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      const newIds = Array.from(new Set([...selectedPageIds, ...allIdsInBm]))
      onSelectionChange(newIds)
    } else {
      onSelectionChange(selectedPageIds.filter(id => !allIdsInBm.includes(id)))
    }
  }

  const handleSelectThird = (part: 1 | 2 | 3) => {
    const total = business.pages.length
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
    
    const slice = business.pages.slice(start, end).map(p => p.id)
    // Keep other selections, but replace this BM's selection with the slice
    const otherSelections = selectedPageIds.filter(id => !allIdsInBm.includes(id))
    onSelectionChange([...otherSelections, ...slice])
    toast.info(`Selected part ${part}/3 for ${business.name} (${slice.length} items)`)
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}`)
  }

  return (
    <div className="border border-border/50 bg-card/40 rounded-2xl overflow-hidden backdrop-blur-sm shadow-lg transition-all hover:shadow-primary/5">
      {/* Business Header */}
      <div className="bg-muted/30 border-b border-border/50 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
             onClick={() => setIsCollapsed(!isCollapsed)}
             className="p-1 hover:bg-background/80 rounded transition-colors text-muted-foreground cursor-pointer"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-background border border-border/40 rounded-lg">
              <Briefcase className="w-4 h-4 text-primary/70" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                 <h3 className="text-sm font-bold tracking-tight">{business.name}</h3>
                 <Badge variant="outline" className="text-sm h-5 font-mono bg-background px-1.5 border-border/40">
                    {business.id}
                 </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 font-medium tracking-wide">
                 {business.pages.length} Assets Linked • {business.assignedPageIds.length} Assigned to Identity
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex -space-x-1.5">
              {(business.permitted_roles ?? []).map((role, idx) => (
                <Badge key={idx} variant="outline" className="text-[10px] font-bold h-5 border-primary/20 bg-primary/5 text-primary">
                  {role}
                </Badge>
              ))}
           </div>
           <Checkbox 
              checked={isAllSelected}
              onCheckedChange={handleToggleAll}
              className="border-border/60 data-[state=checked]:bg-primary cursor-pointer"
           />
        </div>
      </div>

      {/* Pages Table */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          {/* Shortcuts area */}
          {business.pages.length > 0 && (
            <div className="p-3 border-b border-border/30 bg-muted/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <span className="text-sm font-medium text-primary tracking-wide">
                        {selectedInBm.length} items selected in this node
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
                            onSelectionChange(selectedPageIds.filter(id => !allIdsInBm.includes(id)))
                            toast.info("Cleared BM selection")
                        }}
                        className="h-7 px-1.5 text-red-600 border-red-600 hover:text-red-600 hover:bg-red-600/10 transition-all rounded-lg ml-0.5 cursor-pointer"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        <span className="text-[10px] font-bold">Clear</span>
                    </Button>
                </div>
            </div>
          )}
          
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
              {business.pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center opacity-30 italic text-sm">
                    No discoverable assets in this node.
                  </TableCell>
                </TableRow>
              ) : (
                business.pages.map((page) => (
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
                       {business.assignedPageIds.includes(page.id) ? (
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
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from "react"
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
  ExternalLink, 
  ShieldCheck, 
  Briefcase,
  Layers,
  MoreVertical,
  CheckCircle2,
  Lock
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
  activeViewerId: string
  activeToken: string
}

export default function BusinessAssetCard({ 
  business, 
  selectedPageIds, 
  onSelectionChange,
  activeViewerId,
  activeToken
}: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const allIdsInBm = business.pages.map(p => p.id)
  const isAllSelected = allIdsInBm.length > 0 && allIdsInBm.every(id => selectedPageIds.includes(id))
  
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
             className="p-1 hover:bg-background/80 rounded transition-colors text-muted-foreground"
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
                 <Badge variant="outline" className="text-[9px] h-4 font-mono uppercase bg-background px-1.5 border-border/40">
                    {business.id}
                 </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                 {business.pages.length} Assets Linked • {business.assignedPageIds.length} Assigned to Identity
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex -space-x-1.5">
              {(business.permitted_roles ?? []).map((role, idx) => (
                <Badge key={idx} variant="outline" className="text-[9px] font-bold h-4 uppercase border-primary/20 bg-primary/5 text-primary">
                  {role}
                </Badge>
              ))}
           </div>
           <Checkbox 
              checked={isAllSelected}
              onCheckedChange={handleToggleAll}
              className="border-border/60 data-[state=checked]:bg-primary"
           />
        </div>
      </div>

      {/* Pages Table */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-border/50">
                <TableHead className="w-12 text-center py-2.5">
                   <Layers className="w-3.5 h-3.5 mx-auto opacity-40" />
                </TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Architectural Name</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Classification</TableHead>
                <TableHead className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Identity Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {business.pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center opacity-30 italic text-xs">
                    No discoverable assets in this node.
                  </TableCell>
                </TableRow>
              ) : (
                business.pages.map((page) => (
                  <TableRow 
                    key={page.id} 
                    className={cn(
                      "group border-border/20 transition-colors h-10",
                      selectedPageIds.includes(page.id) ? "bg-primary/5 border-primary/10" : "hover:bg-muted/20"
                    )}
                    onClick={() => handleToggleSelection(page.id)}
                  >
                    <TableCell className="text-center py-2" onClick={e => e.stopPropagation()}>
                       <Checkbox 
                          checked={selectedPageIds.includes(page.id)}
                          onCheckedChange={() => handleToggleSelection(page.id)}
                          className="border-border/60"
                       />
                    </TableCell>
                    <TableCell className="py-2">
                       <div className="flex flex-col">
                          <span className="text-xs font-bold leading-none">{page.name}</span>
                          <span className="text-[9px] font-mono text-muted-foreground/60 mt-0.5">{page.id}</span>
                       </div>
                    </TableCell>
                    <TableCell className="py-2">
                       <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 border-border/40 text-muted-foreground bg-muted/5 font-medium">
                          {page.category || "GENERAL"}
                       </Badge>
                    </TableCell>
                    <TableCell className="py-2">
                       {business.assignedPageIds.includes(page.id) ? (
                         <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                            <span className="text-[10px] font-bold text-emerald-600/70 uppercase">In Control</span>
                         </div>
                       ) : (
                         <div className="flex items-center gap-1.5 opacity-40">
                            <Lock className="w-2.5 h-2.5" />
                            <span className="text-[10px] font-bold uppercase">Locked</span>
                         </div>
                       )}
                    </TableCell>
                    <TableCell className="py-2 text-right pr-4" onClick={e => e.stopPropagation()}>
                       <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleCopy(page.id, "Page ID")}
                       >
                          <Copy className="w-3 h-3 text-muted-foreground" />
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

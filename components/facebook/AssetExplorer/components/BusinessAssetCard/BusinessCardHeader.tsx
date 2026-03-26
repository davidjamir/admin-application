import React from "react"
import { ChevronDown, ChevronUp, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { BusinessRow } from "@/types/facebook"

interface BusinessCardHeaderProps {
  business: BusinessRow
  isCollapsed: boolean
  setIsCollapsed: (val: boolean) => void
  isAllSelected: boolean
  handleToggleAll: (checked: boolean) => void
  onOpenDetails: () => void
}

export function BusinessCardHeader({
  business, isCollapsed, setIsCollapsed, isAllSelected, handleToggleAll, onOpenDetails
}: BusinessCardHeaderProps) {
  return (
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
               {business.verification_status === "verified" && (
                 <div className="bg-blue-500 rounded-full p-0.5" title="Verified Business">
                   <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                 </div>
               )}
               <Badge variant="outline" className="text-sm h-5 font-mono bg-background px-1.5 border-border/40">
                  {business.id}
               </Badge>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-[10px] text-muted-foreground font-medium tracking-wide">
                 {business.pages.length} Pages • {business.assignedPageIds.length} Assigned
              </p>
              {(business.owned_ad_accounts?.data?.length ?? 0) > 0 && (
                <span className="text-[10px] text-primary/70 font-bold">• {business.owned_ad_accounts?.data?.length} Ad Accounts</span>
              )}
              {(business.adspixels?.data?.length ?? 0) > 0 && (
                <span className="text-[10px] text-emerald-600/70 font-bold">• {business.adspixels?.data?.length} Pixels</span>
              )}
              {(business.apps?.length ?? 0) > 0 && (
                <span className="text-[10px] text-orange-600/70 font-bold">• {business.apps?.length} Apps</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
         <Button 
           variant="ghost" 
           size="sm" 
           className="h-8 text-[10px] font-bold gap-1.5 hover:bg-primary/5 hover:text-primary transition-all border border-border/40"
           onClick={(e) => {
             e.stopPropagation()
             onOpenDetails()
           }}
         >
           <Briefcase className="w-3 h-3" />
           Details
         </Button>
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
  )
}

"use client"

import React, { useState, useMemo } from "react"
import { 
  Package, 
  Loader2, 
  Search, 
  Check,
  Plus
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { BusinessRow } from "@/types/facebook"

interface AddToGroupDialogProps {
  business: BusinessRow
  pageId: string
  pageName: string
  adminToken: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

export function AddToGroupDialog({ 
  business, 
  pageId, 
  pageName, 
  adminToken, 
  trigger,
  onSuccess 
}: AddToGroupDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredGroups = useMemo(() => {
    const groups = business.business_asset_groups?.data || []
    return groups.filter(g => 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      g.id.includes(searchQuery)
    )
  }, [business.business_asset_groups?.data, searchQuery])

  const handleAdd = async () => {
    if (!selectedGroupId) {
      toast.error("Please Select An Asset Group")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${selectedGroupId}?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_asset",
          assetId: pageId,
          type: "PAGE"
        })
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed To Add Page To Group")

      toast.success(`Successfully Added ${pageName} To Asset Group`)
      setIsOpen(false)
      setSelectedGroupId(null)
      onSuccess?.()
    } catch (error) {
      console.error("[AddToGroupDialog] Error:", error)
      toast.error(error instanceof Error ? error.message : "Internal Server Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Add to Group
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Package className="w-5 h-5 text-primary" />
            </div>
            Add to Asset Group
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1 px-1">
            Include <span className="text-foreground font-medium">{pageName}</span> in a business asset group.
          </p>
        </DialogHeader>

        <div className="p-5 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-muted-foreground/70">
                Select Asset Group
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40" />
                <input 
                  type="text" 
                  placeholder="Find group or ID..."
                  className="h-6 pl-6 pr-3 text-[9px] bg-muted/30 border border-border/40 rounded-md outline-none focus:ring-1 focus:ring-primary/20 w-44 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/5">
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                {filteredGroups.length > 0 ? (
                  <div className="divide-y divide-border/10">
                    {filteredGroups.map((group) => {
                      const isSelected = selectedGroupId === group.id
                      const alreadyInGroup = group.contained_pages?.data?.some((p: { id: string }) => p.id === pageId)

                      return (
                        <div 
                          key={group.id}
                          className={cn(
                            "flex items-center justify-between p-2.5 px-4 hover:bg-muted/40 transition-colors cursor-pointer group select-none",
                            isSelected && "bg-primary/[0.04]",
                            alreadyInGroup && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                              if (!alreadyInGroup) setSelectedGroupId(group.id)
                          }}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black transition-all shadow-sm",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            )}>
                              {group.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "text-[11px] font-bold truncate",
                                  isSelected ? "text-primary" : "text-foreground"
                                )}>{group.name}</p>
                                {alreadyInGroup && (
                                  <span className="text-[7px] px-1.5 py-0.5 rounded-full border border-primary/20 bg-primary/5 text-primary font-bold leading-none">
                                    Already assigned
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-muted-foreground/50 font-mono">
                                ID: {group.id}
                              </p>
                            </div>
                          </div>
                          {!alreadyInGroup && (
                            <div className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 transform",
                                isSelected 
                                ? "bg-primary border-primary scale-100 opacity-100 shadow-sm" 
                                : "border-border/60 group-hover:border-primary/40 scale-90 opacity-40 shadow-none"
                            )}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={4} />}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-[10px] text-muted-foreground/60 italic">
                    No Asset Groups Found
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-muted/10 border-t border-border/40 flex items-center justify-end gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(false)}
            className="text-[10px] h-8 font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            disabled={isSubmitting || !selectedGroupId}
            onClick={handleAdd}
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] px-5 h-8 transition-all shadow-md active:scale-95",
              (isSubmitting || !selectedGroupId) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-2.5 h-2.5 animate-spin mr-1.5" />
                Adding to Group...
              </>
            ) : (
              `Confirm Assignment`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

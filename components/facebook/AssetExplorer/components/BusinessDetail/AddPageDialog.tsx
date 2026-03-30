"use client"

import React, { useState, useMemo, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, Flag, AlertCircle, Search, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { FacebookPage } from "@/types/facebook"

interface AddPageDialogProps {
  businessId: string
  adminToken: string
  onSuccess?: () => void
  standalonePages?: FacebookPage[]
}

export function AddPageDialog({ 
  businessId, 
  adminToken, 
  onSuccess,
  standalonePages = []
}: AddPageDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedStandaloneIds, setSelectedStandaloneIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const togglePageSelection = useCallback((id: string) => {
    setSelectedStandaloneIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    )
  }, [])

  const filteredStandalonePages = useMemo(() => {
    return standalonePages.filter(page => 
      page.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      page.id.includes(searchQuery)
    )
  }, [standalonePages, searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedStandaloneIds.length === 0) {
      toast.error("Please select at least one page from the list")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/facebook/business/${businessId}/pages?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageIds: selectedStandaloneIds }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to add pages")

      toast.success(data.message || `Successfully processed ${selectedStandaloneIds.length} pages`)
      setIsOpen(false)
      setSelectedStandaloneIds([])
      onSuccess?.()
    } catch (error) {
      console.error("[Batch Add Pages] error:", error)
      toast.error(error instanceof Error ? error.message : "Internal Server Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 hover:text-primary cursor-pointer transition-opacity"
        >
          <Plus className="w-3 h-3" />
          Add Page
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-medium tracking-tight">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Flag className="w-5 h-5 text-primary" />
            </div>
            Add Pages to Business
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-auto max-h-[80vh]">
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            
            {/* Standalone Pages Selection List (Primary) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  Select Pages to Add
                </Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40" />
                  <input 
                    type="text"
                    placeholder="Search..."
                    className="h-6 pl-7 pr-3 text-[10px] bg-muted/20 border border-border/30 rounded-md outline-none focus:ring-1 focus:ring-primary/20 w-36 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {standalonePages.length > 0 ? (
                <div className="border border-border/30 rounded-lg overflow-hidden bg-muted/5">
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <div className="divide-y divide-border/10">
                      {filteredStandalonePages.map((page) => {
                        const isSelected = selectedStandaloneIds.includes(page.id)
                        return (
                          <div 
                            key={page.id}
                            className={cn(
                              "flex items-center gap-2.5 p-2 px-3 hover:bg-muted/30 transition-colors cursor-pointer group select-none",
                              isSelected && "bg-primary/[0.03]"
                            )}
                            onClick={() => togglePageSelection(page.id)}
                          >
                            <div className={cn(
                              "h-3.5 w-3.5 rounded border transition-all flex items-center justify-center shrink-0",
                              isSelected ? "bg-primary border-primary text-primary-foreground" : "border-border/50"
                            )}>
                              {isSelected && <Plus className="w-2.5 h-2.5 rotate-45" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-[11px] font-medium truncate transition-colors",
                                isSelected ? "text-primary" : "group-hover:text-primary"
                              )}>
                                {page.name}
                              </p>
                              <p className="text-[8px] text-muted-foreground/70 font-mono leading-none">ID: {page.id}</p>
                            </div>
                            {page.category && (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/80 capitalize shrink-0 font-medium">
                                {page.category.toLowerCase()}
                              </span>
                            )}
                          </div>
                        )
                      })}
                      {filteredStandalonePages.length === 0 && (
                        <div className="p-6 text-center text-muted-foreground/40 text-[10px] italic">
                          No matching pages
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center border border-dashed border-border/20 rounded-lg bg-muted/5">
                  <p className="text-[11px] text-muted-foreground/60 italic">No available pages to add to this business.</p>
                </div>
              )}
            </div>

            {/* Summary Badge */}
            {selectedStandaloneIds.length > 0 && (
              <div className="flex gap-2 p-2.5 px-3 bg-primary/[0.02] border border-primary/10 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 opacity-60" />
                <div className="text-[9px] text-primary/70 leading-relaxed uppercase font-semibold tracking-wider">
                  {selectedStandaloneIds.length} unique page{selectedStandaloneIds.length !== 1 ? 's' : ''} selected
                </div>
              </div>
            )}
          </div>
          
          <div className="p-5 pt-2 border-t border-border/10 bg-muted/[0.02]">
            <Button 
              type="submit" 
              disabled={isSubmitting || selectedStandaloneIds.length === 0}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all cursor-pointer font-medium h-10 rounded-lg text-[11px] uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Claim {selectedStandaloneIds.length > 0 ? `${selectedStandaloneIds.length} ` : ''}Page{selectedStandaloneIds.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

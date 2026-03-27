"use client"

import React from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet"
import { FacebookPage } from "@/types/facebook"
import { 
  Settings2, 
  Globe, 
  Tag, 
  FileText,
  Save
} from "lucide-react"
import { Button } from "@/components/ui/button"


interface PageEditSheetProps {
  page: FacebookPage | null
  isOpen: boolean
  onClose: () => void
}

export function PageEditSheet({ page, isOpen, onClose }: PageEditSheetProps) {
  if (!page) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[30vw] w-full p-0 border-l border-border/50 bg-card/95 backdrop-blur-xl">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Settings2 className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-1">
                <SheetTitle className="text-xl font-normal tracking-tight">
                  Edit Page
                </SheetTitle>
                <SheetDescription className="text-xs font-mono truncate max-w-[200px]">
                  {page.name} ({page.id})
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* Basic Info */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <Globe className="w-4 h-4 text-primary/70" />
                  <h4 className="text-sm font-normal">General Settings</h4>
               </div>
               
               <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-black/40 ml-1">Page Name</label>
                    <div className="px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-sm text-black/60">
                      {page.name}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-black/40 ml-1">Category</label>
                    <div className="px-3 py-2 bg-muted/30 border border-border/40 rounded-lg text-sm capitalize text-black/60">
                      {page.category?.toLowerCase()}
                    </div>
                  </div>
               </div>
            </div>

            {/* Config placeholder */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                  <Tag className="w-4 h-4 text-primary/70" />
                  <h4 className="text-sm font-normal">Page Attributes</h4>
               </div>
               
               <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/10 text-center">
                  <FileText className="w-8 h-8 text-black/10 mx-auto mb-2" />
                  <p className="text-[10px] text-black/40 leading-relaxed">
                    Additional page configuration modules will be dynamically loaded based on asset permissions.
                  </p>
               </div>
            </div>
          </div>

          <div className="p-6 border-t border-border/50 bg-muted/30">
            <Button className="w-full gap-2 rounded-xl h-11" onClick={onClose}>
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

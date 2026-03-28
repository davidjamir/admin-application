"use client"

import React, { useState } from "react"
import { Layers, Zap, MessageSquare, Pencil, Globe, Users, Trash2, ChevronRight, Fingerprint, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BusinessRow } from "@/types/facebook"
import { Section, DetailContainer, Item } from "./SharedComponents"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface AssetsTabProps {
  business: BusinessRow
  adminToken: string
}

export const AssetsTab = ({ business, adminToken }: AssetsTabProps) => {
  const [selectedAssetGroupId, setSelectedAssetGroupId] = useState<string | null>(null)
  const [selectedPixelId, setSelectedPixelId] = useState<string | null>(null)
  const [selectedWhatsAppId, setSelectedWhatsAppId] = useState<string | null>(null)

  const clearSelections = () => {
    setSelectedAssetGroupId(null)
    setSelectedPixelId(null)
    setSelectedWhatsAppId(null)
  }

  const selectedId = selectedAssetGroupId || selectedPixelId || selectedWhatsAppId
  const type = selectedAssetGroupId ? "Asset Group" : selectedPixelId ? "Tracking Pixel" : "WhatsApp Account"
  const selectedItem =
    (selectedAssetGroupId ? business.business_asset_groups?.data?.find(g => g.id === selectedAssetGroupId) :
      selectedPixelId ? business.adspixels?.data?.find(p => p.id === selectedPixelId) :
        business.whatsapp_business_accounts?.data?.find(w => w.id === selectedWhatsAppId)) as { id: string; name: string } | undefined

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [isRenaming, setIsRenaming] = useState(false)

  const [assetGroupToDelete, setAssetGroupToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const copyId = () => {
    if (selectedItem?.id) {
      navigator.clipboard.writeText(selectedItem.id)
      import('sonner').then(({ toast }) => toast.success("ID Copied"))
    }
  }

  const handleRename = async () => {
    if (!selectedAssetGroupId || !newName.trim()) return;
    try {
      setIsRenaming(true)
      const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${selectedAssetGroupId}?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() })
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to rename asset group")
      
      toast.success("Asset group renamed successfully")
      setIsRenameDialogOpen(false)
      
      // Optimistic update
      if (selectedItem) {
        selectedItem.name = newName.trim()
      }
      
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to rename")
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDelete = async (groupId: string) => {
    try {
      setIsDeleting(true)
      const res = await fetch(`/api/facebook/business/${business.id}/asset-groups/${groupId}?token=${encodeURIComponent(adminToken)}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to delete asset group")
      
      toast.success("Asset group deleted successfully")
      setAssetGroupToDelete(null)
      if (selectedAssetGroupId === groupId) {
        clearSelections()
      }
      
      // Optimistic update
      const index = business.business_asset_groups?.data?.findIndex(g => g.id === groupId)
      if (index !== undefined && index > -1 && business.business_asset_groups?.data) {
        business.business_asset_groups.data.splice(index, 1)
      }
      
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete asset group")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DetailContainer
      isOpen={!!selectedId}
      onClose={clearSelections}
      detailContent={
        selectedItem ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-border/50 bg-muted/20 flex items-center justify-center p-0">
                  {selectedAssetGroupId ? <Layers className="w-8 h-8 text-primary/40" /> :
                    selectedPixelId ? <Zap className="w-8 h-8 text-primary/40" /> :
                      <MessageSquare className="w-8 h-8 text-primary/40" />}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-medium tracking-tight flex items-center gap-2">
                      {selectedItem.name || selectedItem.id}
                    </h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="text-[10px] font-normal h-5 border-primary/20 bg-primary/5 text-primary capitalize">
                        Owned
                      </Badge>
                    </div>
                  </div>
                  <div 
                    onClick={copyId}
                    className="text-[10px] text-muted-foreground font-mono hover:text-primary hover:bg-primary/5 px-1.5 py-0.5 rounded -ml-1.5 w-fit transition-colors cursor-pointer group/id flex items-center gap-1.5"
                    title="Click to copy ID"
                  >
                    <Fingerprint className="w-3 h-3 text-muted-foreground/50 group-hover/id:text-primary/70 transition-colors" />
                    ID: {selectedItem.id}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  if (type === "Asset Group" && selectedAssetGroupId) {
                    setAssetGroupToDelete(selectedAssetGroupId)
                  } else {
                    toast.info(`Deleting ${type} is not supported yet`)
                  }
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors group cursor-pointer mr-10" 
                title={`Delete ${type}`}
              >
                <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3" />
                Management Task
              </h4>
              <div className="grid gap-2">
                {[
                  { 
                    label: `Update ${type}`, 
                    description: `Change settings for this ${type.toLowerCase()}`, 
                    icon: Pencil,
                    action: type === "Asset Group" ? () => {
                      setNewName(selectedItem?.name || "")
                      setIsRenameDialogOpen(true)
                    } : undefined
                  },
                  { label: "Assign Partners", description: "Share this asset with other businesses", icon: Globe },
                  { label: "Manage Permissions", description: "Control who can access this asset", icon: Users }
                ].map((task, i) => (
                  <button 
                    key={i} 
                    onClick={task.action}
                    className="p-3 w-full text-left rounded-lg border border-border/40 bg-card flex items-center justify-between group hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded flex items-center justify-center bg-primary/5">
                        <task.icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium">{task.label}</p>
                        <p className="text-[10px] text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null
      }
    >
      <Section title="Asset Groups" icon={Layers} count={business.business_asset_groups?.data?.length}>
        {business.business_asset_groups?.data?.map((group) => (
          <Item
            key={group.id}
            isSelected={selectedAssetGroupId === group.id}
            onClick={() => { clearSelections(); setSelectedAssetGroupId(selectedAssetGroupId === group.id ? null : group.id); }}
            label={group.name}
            value={group.id}
            isID
          />
        ))}
        {!business.business_asset_groups?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No asset groups found</p>}
      </Section>

      <Section title="Tracking Pixels" icon={Zap} count={business.adspixels?.data?.length}>
        {business.adspixels?.data?.map((pix) => (
          <Item
            key={pix.id}
            isSelected={selectedPixelId === pix.id}
            onClick={() => { clearSelections(); setSelectedPixelId(selectedPixelId === pix.id ? null : pix.id); }}
            label={pix.name}
            value={pix.id}
            isID
          />
        ))}
        {!business.adspixels?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No pixels found</p>}
      </Section>

      <Section title="WhatsApp Business" icon={MessageSquare} count={business.whatsapp_business_accounts?.data?.length}>
        {business.whatsapp_business_accounts?.data?.map((wa) => (
          <Item
            key={wa.id}
            isSelected={selectedWhatsAppId === wa.id}
            onClick={() => { clearSelections(); setSelectedWhatsAppId(selectedWhatsAppId === wa.id ? null : wa.id); }}
            label={wa.name}
            value={wa.id}
            status={wa.status}
            isID
          />
        ))}
        {!business.whatsapp_business_accounts?.data?.length && <p className="text-xs text-muted-foreground italic pl-2">No WhatsApp accounts found</p>}
      </Section>

      <Dialog open={isRenameDialogOpen} onOpenChange={(open) => !isRenaming && setIsRenameDialogOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Asset Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new name"
              disabled={isRenaming}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="cursor-pointer" onClick={() => setIsRenameDialogOpen(false)} disabled={isRenaming}>
              Cancel
            </Button>
            <Button 
              onClick={handleRename} 
              disabled={isRenaming || !newName.trim() || newName.trim() === selectedItem?.name}
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            >
              {isRenaming && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assetGroupToDelete} onOpenChange={(open) => !open && !isDeleting && setAssetGroupToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete Asset Group</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-sm">
            Are you sure you want to delete the asset group <strong>{business.business_asset_groups?.data?.find(g => g.id === assetGroupToDelete)?.name}</strong>? This action cannot be undone.
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="cursor-pointer" onClick={() => setAssetGroupToDelete(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => assetGroupToDelete && handleDelete(assetGroupToDelete)} 
              disabled={isDeleting}
              className="cursor-pointer shadow-sm"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DetailContainer>
  )
}

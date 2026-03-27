import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ClipboardPaste, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { PageInfo } from "@/hooks/usePageEdit"

interface LocationFieldsProps {
  fullAddress: string
  handleFullAddressChange: (val: string) => void
  location: { street?: string; city?: string; zip?: string; country?: string }
  setPageInfo: React.Dispatch<React.SetStateAction<PageInfo | null>>
  updateFullAddressFromFields: (loc: { street?: string; city?: string; country?: string; zip?: string }) => void
  pageInfo: PageInfo
}

export function LocationFields({
  fullAddress, handleFullAddressChange, location, setPageInfo,
  updateFullAddressFromFields, pageInfo
}: LocationFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="fullAddress" className="text-[13px] font-semibold text-muted-foreground/80">Address (street, city, zip, country)</Label>
        <div className="flex gap-2">
          <Input id="fullAddress" value={fullAddress} onChange={(e) => handleFullAddressChange(e.target.value)}
            placeholder="Paste full address here" className="flex-1 h-10 px-3 rounded-lg bg-background/50 text-sm shadow-inner" />
          <div className="flex gap-1.5 shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={async () => { try { const text = await navigator.clipboard.readText(); handleFullAddressChange(text); toast.success("Address pasted and parsed") } catch { toast.error("Failed to read clipboard") } }}
              className="h-10 w-10 bg-background/50 hover:bg-primary/5 border-border/40 rounded-lg group cursor-pointer"
            >
              <ClipboardPaste className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              size="icon" 
              onClick={() => { handleFullAddressChange(""); setPageInfo({ ...pageInfo, location: { street: "", city: "", country: "", zip: "" } }) }}
              className="h-10 w-10 bg-background/50 hover:bg-rose-50 border-border/40 hover:border-rose-200 rounded-lg group cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 transition-colors" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="street" className="text-[11px] font-bold text-muted-foreground/60">Street</Label>
          <Input id="street" value={location?.street || ""} 
            onChange={(e) => { const newLoc = { ...location, street: e.target.value }; setPageInfo({ ...pageInfo, location: newLoc }); updateFullAddressFromFields(newLoc) }}
            className="h-10 px-3 rounded-lg bg-background/30 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city" className="text-[11px] font-bold text-muted-foreground/60">City</Label>
          <Input id="city" value={location?.city || ""} 
            onChange={(e) => { const newLoc = { ...location, city: e.target.value }; setPageInfo({ ...pageInfo, location: newLoc }); updateFullAddressFromFields(newLoc) }}
            className="h-10 px-3 rounded-lg bg-background/30 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="zip" className="text-[11px] font-bold text-muted-foreground/60">Zip</Label>
          <Input id="zip" value={location?.zip || ""} 
            onChange={(e) => { const newLoc = { ...location, zip: e.target.value }; setPageInfo({ ...pageInfo, location: newLoc }); updateFullAddressFromFields(newLoc) }}
            className="h-10 px-3 rounded-lg bg-background/30 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-[11px] font-bold text-muted-foreground/60">Country</Label>
          <Input id="country" value={location?.country || ""} 
            onChange={(e) => { const newLoc = { ...location, country: e.target.value }; setPageInfo({ ...pageInfo, location: newLoc }); updateFullAddressFromFields(newLoc) }}
            className="h-10 px-3 rounded-lg bg-background/30 text-sm" />
        </div>
      </div>
    </>
  )
}

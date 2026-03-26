"use client"

import React from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FacebookPage } from "@/types/facebook"
import { facebookService } from "@/services/facebook.service"
import { toast } from "sonner"
import { Loader2, Pencil } from "lucide-react"
import { usePageEdit } from "@/hooks/usePageEdit"
import { LocationFields } from "./components/PageEdit/LocationFields"
import { ContactFields } from "./components/PageEdit/ContactFields"
import { AboutDescriptionFields } from "./components/PageEdit/AboutDescriptionFields"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  page: FacebookPage | null
  adminToken: string
}

export default function PageEditModal({ isOpen, onClose, onSuccess, page, adminToken }: Props) {
  const {
    loading, saving, setSaving, 
    pageInfo, setPageInfo,
    fullAddress,
    handleFullAddressChange, 
    updateFullAddressFromFields,
    countryCode, setCountryCode,
    phoneNumber,
    handlePhoneChange,
    handleRandomPhone,
    domains, selectedDomain,
    handleDomainSelect
  } = usePageEdit(adminToken, page, isOpen)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!page || !pageInfo) return
    try {
      setSaving(true)
      const fullPhone = phoneNumber ? `${countryCode}${phoneNumber.replace(/\s+/g, "").replace(/^0/, "")}` : ""
      const updates = {
        about: pageInfo.about,
        description: pageInfo.description,
        category: pageInfo.category,
        website: pageInfo.website,
        phone: fullPhone,
        email: pageInfo.emails?.[0],
        location: pageInfo.location
      }
      await facebookService.updatePageInfo(adminToken, page.id, updates, page.access_token)
      toast.success("Page information updated successfully")
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update page information"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  if (!page) return null

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="!w-[30%] !max-w-none overflow-y-auto bg-card border-none shadow-2xl p-0">
        <SheetHeader className="pb-4 border-b border-border/40 p-6">
          <SheetTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Pencil className="w-5 h-5 text-primary" />
            </div>
            Edit Page: {page.name}
          </SheetTitle>
          <p className="text-xs text-muted-foreground font-mono mt-1 opacity-60">ID: {page.id}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground animate-pulse">Loading information...</p>
            </div>
          ) : pageInfo ? (
            <form id="edit-page-form" onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col gap-6">
                <AboutDescriptionFields 
                  about={pageInfo.about || ""}
                  setAbout={(val) => setPageInfo({ ...pageInfo, about: val })}
                  description={pageInfo.description || ""}
                  setDescription={(val) => setPageInfo({ ...pageInfo, description: val })}
                />

                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-[13px] font-semibold text-muted-foreground/80">Category</Label>
                    <Input id="category" value={pageInfo.category || ""} 
                      onChange={(e) => setPageInfo({ ...pageInfo, category: e.target.value })}
                      placeholder="Category" className="h-10 px-3 rounded-lg bg-background/50 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-[13px] font-semibold text-muted-foreground/80">Website</Label>
                    <Input id="website" value={pageInfo.website || ""} 
                      onChange={(e) => setPageInfo({ ...pageInfo, website: e.target.value })}
                      placeholder="https://..." className="h-10 px-3 rounded-lg bg-background/50 text-sm" />
                  </div>
                </div>

                <LocationFields 
                  fullAddress={fullAddress}
                  handleFullAddressChange={handleFullAddressChange}
                  location={pageInfo.location || {}}
                  setPageInfo={setPageInfo}
                  updateFullAddressFromFields={updateFullAddressFromFields}
                  pageInfo={pageInfo}
                />

                <ContactFields 
                  countryCode={countryCode}
                  setCountryCode={setCountryCode}
                  phoneNumber={phoneNumber}
                  handlePhoneChange={handlePhoneChange}
                  handleRandomPhone={handleRandomPhone}
                  email={pageInfo.emails?.[0] || ""}
                  setEmail={(val) => { setPageInfo({ ...pageInfo, emails: [val] }); }}
                  domains={domains}
                  selectedDomain={selectedDomain}
                  handleDomainSelect={handleDomainSelect}
                />

                <div className="flex flex-col pt-4 gap-2 opacity-60">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                    <span>Direct Data Fetch</span>
                    <span>Optimized for Dashboard</span>
                  </div>
                </div>
              </div>
            </form>
          ) : null}
        </div>

        <div className="border-t p-6 bg-card sticky bottom-0 flex justify-end gap-3 rounded-b-xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <Button type="button" variant="ghost" onClick={onClose} className="rounded-lg px-8 h-10 font-bold">Cancel</Button>
          <Button 
            type="submit" 
            form="edit-page-form"
            disabled={saving} 
            className="rounded-lg px-12 h-10 bg-[#8daaff] hover:bg-[#7a99ff] text-white font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Update"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

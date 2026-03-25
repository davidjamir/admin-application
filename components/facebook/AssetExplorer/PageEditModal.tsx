'use client'

import { useCallback, useEffect, useState } from "react"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { FacebookPage } from "@/types/facebook"
import { facebookService } from "@/services/facebook.service"
import { toast } from "sonner"
import { Loader2, Pencil, Shuffle, ClipboardPaste, Trash2 } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  page: FacebookPage | null
  adminToken: string
}

const COUNTRY_CODES = [
  { label: "+84 (VN)", value: "+84" },
  { label: "+1 (US)", value: "+1" },
  { label: "+44 (UK)", value: "+44" },
  { label: "+81 (JP)", value: "+81" },
  { label: "+61 (AU)", value: "+61" },
  { label: "+33 (FR)", value: "+33" },
  { label: "+49 (DE)", value: "+49" },
  { label: "+86 (CN)", value: "+86" },
  { label: "+91 (IN)", value: "+91" },
  { label: "+65 (SG)", value: "+65" }
]

const RAND_PHONE_NUMBERS = [
  "+1 5053174588",
  "+1 3052062554",
  "+1 9805621692",
  "+1 3052655833",
  "+1 9383498129",
  "+1 7042162513",
  "+1 9838471098",
  "+1 2536868075",
  "+1 8655454194",
  "+1 9834839678",
  "+1 5052520883",
  "+1 6459688867",
  "+1 3052009263",
  "+1 9834048917",
  "+1 9832113240",
  "+1 4724201610",
  "+1 5056469900",
]

export default function PageEditModal({ isOpen, onClose, onSuccess, page, adminToken }: Props) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pageInfo, setPageInfo] = useState<{
    id: string;
    name?: string;
    about?: string;
    description?: string;
    category?: string;
    category_list?: Array<{ id: string; name: string }>;
    website?: string;
    phone?: string;
    location?: { street?: string; city?: string; zip?: string; country?: string };
    emails?: string[];
  } | null>(null)
  const [originalEmail, setOriginalEmail] = useState("")
  
  const [fullAddress, setFullAddress] = useState("")
  const [countryCode, setCountryCode] = useState("+84")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [domains, setDomains] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState("")
  const [, setDomainsLoading] = useState(false)

  const fetchDomains = useCallback(async () => {
    try {
      setDomainsLoading(true)
      const res = await fetch("/api/facebook/domains")
      if (res.ok) {
        const data = await res.json()
        setDomains(data)
      }
    } catch {
      console.error("Failed to fetch domains")
    } finally {
      setDomainsLoading(false)
    }
  }, [])

  const loadPageInfo = useCallback(async () => {
    if (!page) return
    try {
      setLoading(true)
      const info = await facebookService.getPageInfo(adminToken, page.id, page.access_token)
      setPageInfo(info)
      setOriginalEmail(info.emails?.[0] || "")
      
      const loc = info.location || {}
      const addrParts = [loc.street, loc.city, loc.country, loc.zip].filter(Boolean)
      setFullAddress(addrParts.join(", "))
      
      const currentPhone = info.phone || ""
      if (currentPhone) {
        const matched = COUNTRY_CODES.find(c => currentPhone.startsWith(c.value))
        if (matched) {
          setCountryCode(matched.value)
          setPhoneNumber(currentPhone.replace(matched.value, "").trim())
        } else if (currentPhone.startsWith("+")) {
          const plusPart = currentPhone.match(/^\+\d+/)?.[0] || "+84"
          setCountryCode(plusPart)
          setPhoneNumber(currentPhone.replace(plusPart, "").trim())
        } else {
          setPhoneNumber(currentPhone)
        }
      }
    } catch {
      toast.error("Failed to load page information")
      onClose()
    } finally {
      setLoading(false)
    }
  }, [adminToken, onClose, page])

  const handleFullAddressChange = (val: string) => {
    setFullAddress(val)
    const parts = val.split(",").map(p => p.trim())
    setPageInfo((prev) => {
      if (!prev) return null
      const currentLoc = prev.location || {}
      return {
        ...prev,
        location: {
          ...currentLoc,
          street: parts[0] || "",
          city: parts[1] || "",
          country: parts[2] || "",
          zip: parts[3] || ""
        }
      }
    })
  }

  const updateFullAddressFromFields = (loc: { street?: string; city?: string; country?: string; zip?: string }) => {
    const parts = [loc.street, loc.city, loc.country, loc.zip].filter(Boolean)
    setFullAddress(parts.join(", "))
  }

  const handlePhoneChange = (val: string) => {
    const clean = val.trim()
    if (clean.startsWith("0") && clean.length >= 10) {
      setCountryCode("+84")
      setPhoneNumber(clean.substring(1))
      return
    }
    if (clean.startsWith("84") && clean.length >= 11) {
      setCountryCode("+84")
      setPhoneNumber(clean.substring(2))
      return
    }
    if (clean.startsWith("+")) {
      const matched = COUNTRY_CODES.find(c => clean.startsWith(c.value))
      if (matched) {
        setCountryCode(matched.value)
        setPhoneNumber(clean.replace(matched.value, "").trim())
        return
      } else {
        const plusPart = clean.match(/^\+\d+/)?.[0] || "+1"
        setCountryCode(plusPart)
        setPhoneNumber(clean.replace(plusPart, "").trim())
        return
      }
    }
    setPhoneNumber(val)
  }

  const handleRandomPhone = () => {
    const random = RAND_PHONE_NUMBERS[Math.floor(Math.random() * RAND_PHONE_NUMBERS.length)]
    const [code, ...rest] = random.split(" ")
    setCountryCode(code)
    setPhoneNumber(rest.join(" "))
    toast.info(`Generated random phone: ${random}`)
  }

  useEffect(() => {
    if (isOpen && page) {
      void loadPageInfo()
      void fetchDomains()
    } else {
      setPageInfo(null)
      setFullAddress("")
      setPhoneNumber("")
      setSelectedDomain("")
      setOriginalEmail("")
    }
  }, [isOpen, page, loadPageInfo, fetchDomains])

  const handleDomainSelect = (val: string) => {
    setSelectedDomain(val)
    if (val === "original") {
      setPageInfo((prev) => prev ? ({
        ...prev,
        emails: [originalEmail]
      }) : null)
    } else if (val) {
      setPageInfo((prev) => prev ? ({
        ...prev,
        emails: [`contact@${val}`]
      }) : null)
    }
  }

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
                {/* Row 1: About (Expanded) */}
                <div className="space-y-2">
                  <Label htmlFor="about" className="text-[13px] font-semibold text-muted-foreground/80">About</Label>
                  <Textarea id="about" value={pageInfo.about || ""} onChange={(e) => setPageInfo({ ...pageInfo, about: e.target.value })}
                    placeholder="About page..." className="min-h-[100px] px-3 py-2 rounded-lg bg-background/50 text-sm resize-none" />
                </div>

                {/* Row 2: Category & Website */}
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

                {/* Address & Phone */}
                <div className="space-y-2">
                  <Label htmlFor="fullAddress" className="text-[13px] font-semibold text-muted-foreground/80">Address (Street, City, Zip, Country)</Label>
                  <div className="flex gap-2">
                    <Input id="fullAddress" value={fullAddress} onChange={(e) => handleFullAddressChange(e.target.value)}
                      placeholder="Paste full address here" className="flex-1 h-10 px-3 rounded-lg bg-background/50 text-sm shadow-inner" />
                    <div className="flex gap-1.5 shrink-0">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={async () => { try { const text = await navigator.clipboard.readText(); handleFullAddressChange(text); toast.success("Address pasted and parsed") } catch { toast.error("Failed to read clipboard") } }}
                        className="h-10 w-10 bg-background/50 hover:bg-primary/5 border-border/40 rounded-lg group"
                      >
                        <ClipboardPaste className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={() => { setFullAddress(""); setPageInfo({ ...pageInfo, location: { street: "", city: "", country: "", zip: "" } }) }}
                        className="h-10 w-10 bg-background/50 hover:bg-rose-50 border-border/40 hover:border-rose-200 rounded-lg group"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-rose-500 transition-colors" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Split Address Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="street" className="text-[11px] font-bold text-muted-foreground/60 uppercase">Street</Label>
                    <Input id="street" value={pageInfo.location?.street || ""} 
                      onChange={(e) => { const newLoc = { ...pageInfo.location, street: e.target.value }; setPageInfo({ ...pageInfo, location: newLoc }); updateFullAddressFromFields(newLoc) }}
                      className="h-10 px-3 rounded-lg bg-background/30 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city" className="text-[11px] font-bold text-muted-foreground/60 uppercase">City</Label>
                    <Input id="city" value={pageInfo.location?.city || ""} 
                      onChange={(e) => { const newLoc = { ...pageInfo.location, city: e.target.value }; setPageInfo({ ...pageInfo, location: newLoc }); updateFullAddressFromFields(newLoc) }}
                      className="h-10 px-3 rounded-lg bg-background/30 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="zip" className="text-[11px] font-bold text-muted-foreground/60 uppercase">Zip</Label>
                    <Input id="zip" value={pageInfo.location?.zip || ""} 
                      onChange={(e) => { const newLoc = { ...pageInfo.location, zip: e.target.value }; setPageInfo({ ...pageInfo, location: newLoc }); updateFullAddressFromFields(newLoc) }}
                      className="h-10 px-3 rounded-lg bg-background/30 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country" className="text-[11px] font-bold text-muted-foreground/60 uppercase">Country</Label>
                    <Input id="country" value={pageInfo.location?.country || ""} 
                      onChange={(e) => { const newLoc = { ...pageInfo.location, country: e.target.value }; setPageInfo({ ...pageInfo, location: newLoc }); updateFullAddressFromFields(newLoc) }}
                      className="h-10 px-3 rounded-lg bg-background/30 text-sm" />
                  </div>
                </div>

                {/* Contact: Phone & Email */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[13px] font-semibold text-muted-foreground/80">Phone</Label>
                    <div className="flex gap-2">
                      <Select value={countryCode} onValueChange={setCountryCode}>
                        <SelectTrigger className="w-[120px] h-10 px-3 py-0 rounded-lg bg-background/50 text-sm flex items-center">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>{COUNTRY_CODES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input id="phone" value={phoneNumber} onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="Number" className="flex-1 h-10 px-3 rounded-lg bg-background/50 font-mono text-sm" />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        onClick={handleRandomPhone}
                        className="h-10 w-10 bg-primary/5 hover:bg-primary/10 border-primary/20 rounded-lg group"
                      >
                        <Shuffle className="w-4 h-4 text-primary transition-all group-hover:scale-110" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[13px] font-semibold text-muted-foreground/80">Email</Label>
                    <div className="flex gap-2">
                      <Input id="email" value={pageInfo.emails?.[0] || ""} 
                        onChange={(e) => { setPageInfo({ ...pageInfo, emails: [e.target.value] }); setSelectedDomain("") }}
                        placeholder="Email" className="flex-1 h-10 px-3 rounded-lg bg-background/50 font-mono text-sm" />
                      <Select value={selectedDomain} onValueChange={handleDomainSelect}>
                        <SelectTrigger className="w-[140px] h-10 px-3 py-0 rounded-lg bg-background/50 text-sm font-medium flex items-center">
                          <SelectValue placeholder="domain" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem value="original" className="font-bold text-primary">Original</SelectItem>
                          {domains.map(d => <SelectItem key={d} value={d} className="font-mono text-sm">{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Description (Expanded & At Bottom) */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[13px] font-semibold text-muted-foreground/80">Description</Label>
                  <Textarea id="description" value={pageInfo.description || ""} onChange={(e) => setPageInfo({ ...pageInfo, description: e.target.value })}
                    placeholder="Description..." className="min-h-[120px] px-3 py-2 rounded-lg bg-background/50 text-sm resize-none" />
                </div>

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

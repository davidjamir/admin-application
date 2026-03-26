"use client"

import { useCallback, useEffect, useState } from "react"
import { FacebookPage } from "@/types/facebook"
import { facebookService } from "@/services/facebook.service"
import { toast } from "sonner"

export type PageInfo = {
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
}

export const COUNTRY_CODES = [
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

export const RAND_PHONE_NUMBERS = [
  "+1 5053174588", "+1 3052062554", "+1 9805621692", "+1 3052655833",
  "+1 9383498129", "+1 7042162513", "+1 9838471098", "+1 2536868075",
  "+1 8655454194", "+1 9834839678", "+1 5052520883", "+1 6459688867",
  "+1 3052009263", "+1 9834048917", "+1 9832113240", "+1 4724201610",
  "+1 5056469900",
]

export function usePageEdit(adminToken: string, page: FacebookPage | null, isOpen: boolean) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null)
  const [originalEmail, setOriginalEmail] = useState("")
  
  const [fullAddress, setFullAddress] = useState("")
  const [countryCode, setCountryCode] = useState("+84")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [domains, setDomains] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState("")

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook/domains")
      if (res.ok) {
        const data = await res.json()
        setDomains(data)
      }
    } catch {
      console.error("Failed to fetch domains")
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
    } finally {
      setLoading(false)
    }
  }, [adminToken, page])

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

  const handleDomainSelect = (val: string) => {
    setSelectedDomain(val)
    if (val === "original") {
      setPageInfo((prev) => prev ? ({ ...prev, emails: [originalEmail] }) : null)
    } else if (val) {
      setPageInfo((prev) => prev ? ({ ...prev, emails: [`contact@${val}`] }) : null)
    }
  }

  return {
    loading, saving, setSaving, 
    pageInfo, setPageInfo,
    fullAddress, setFullAddress,
    handleFullAddressChange, 
    updateFullAddressFromFields,
    countryCode, setCountryCode,
    phoneNumber, setPhoneNumber,
    handlePhoneChange,
    handleRandomPhone,
    domains, selectedDomain, setSelectedDomain,
    handleDomainSelect
  }
}

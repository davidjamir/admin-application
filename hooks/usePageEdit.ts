"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
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
  
export type InitialPageData = {
  about: string;
  description: string;
  category: string;
  website: string;
  location: {
    street: string;
    city: string;
    zip: string;
    country: string;
  };
  email: string;
  countryCode: string;
  phoneNumber: string;
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
  const [initialData, setInitialData] = useState<InitialPageData | null>(null)
  const [originalEmail, setOriginalEmail] = useState("")
  
  const [fullAddress, setFullAddress] = useState("")
  const [countryCode, setCountryCode] = useState("+84")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [domains, setDomains] = useState<string[]>([])
  const [selectedDomain, setSelectedDomain] = useState("")

  const fetchDomains = useCallback(async () => {
    try {
      const res = await fetch("/api/facebook/domains", { cache: "no-store" })
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
      // Clear current state to show fresh loading
      setPageInfo(null)
      setInitialData(null)
      
      const info = await facebookService.getPageInfo(adminToken, page.id, page.access_token)
      setPageInfo(info)
      setOriginalEmail(info.emails?.[0] || "")
      
      const loc = info.location || {}
      const addrParts = [loc.street, loc.city, loc.country, loc.zip].filter(Boolean)
      setFullAddress(addrParts.join(", "))
      
      const currentPhone = info.phone || ""
      let initialCC = "+84"
      let initialPN = currentPhone

      if (currentPhone) {
        // Try matching against COUNTRY_CODES first
        const matched = COUNTRY_CODES.find(c => currentPhone.startsWith(c.value))
        if (matched) {
          initialCC = matched.value
          initialPN = currentPhone.substring(matched.value.length).trim()
        } else if (currentPhone.startsWith("+")) {
          // If no match but starts with +, extract the code (e.g., +123...)
          const codeMatch = currentPhone.match(/^\+\d+/)
          if (codeMatch) {
            initialCC = codeMatch[0]
            initialPN = currentPhone.substring(initialCC.length).trim()
          }
        }
      }

      setCountryCode(initialCC)
      setPhoneNumber(initialPN)

      setInitialData({
        about: info.about || "",
        description: info.description || "",
        category: info.category || "",
        website: info.website || "",
        location: {
          street: loc.street || "",
          city: loc.city || "",
          zip: loc.zip || "",
          country: loc.country || ""
        },
        email: info.emails?.[0] || "",
        countryCode: initialCC,
        phoneNumber: initialPN
      })
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
      setInitialData(null)
      setFullAddress("")
      setPhoneNumber("")
      setSelectedDomain("")
      setOriginalEmail("")
    }
  }, [isOpen, page, loadPageInfo, fetchDomains])

  const hasChanges = useMemo(() => {
    if (!initialData || !pageInfo) return false
    
    // Compare basic fields
    const aboutChanged = (pageInfo.about || "") !== initialData.about
    const descChanged = (pageInfo.description || "") !== initialData.description
    const catChanged = (pageInfo.category || "") !== initialData.category
    const webChanged = (pageInfo.website || "") !== initialData.website
    
    // Compare location
    const loc1 = pageInfo.location || {}
    const loc2 = initialData.location || {}
    const locChanged = (loc1.street || "") !== (loc2.street || "") || 
                       (loc1.city || "") !== (loc2.city || "") || 
                       (loc1.zip || "") !== (loc2.zip || "") || 
                       (loc1.country || "") !== (loc2.country || "")
    
    // Compare contacts
    const emailChanged = (pageInfo.emails?.[0] || "") !== (initialData.email || "")
    const phoneChanged = countryCode !== initialData.countryCode || phoneNumber.trim() !== (initialData.phoneNumber || "")
    
    return aboutChanged || descChanged || catChanged || webChanged || locChanged || emailChanged || phoneChanged
  }, [pageInfo, initialData, countryCode, phoneNumber])

  const updateInitialData = useCallback(() => {
    if (!pageInfo) return
    const loc = pageInfo.location || {}
    setInitialData({
      about: pageInfo.about || "",
      description: pageInfo.description || "",
      category: pageInfo.category || "",
      website: pageInfo.website || "",
      location: {
        street: loc.street || "",
        city: loc.city || "",
        zip: loc.zip || "",
        country: loc.country || ""
      },
      email: pageInfo.emails?.[0] || "",
      countryCode,
      phoneNumber: phoneNumber.trim()
    })
  }, [pageInfo, countryCode, phoneNumber])

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
    handleDomainSelect,
    hasChanges,
    updateInitialData
  }
}

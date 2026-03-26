import { useEffect, useState, useMemo, useCallback } from "react"
import { toast } from "sonner"

export interface AdItem {
  _id: string
  source: string
  domain: string
  origin: string
  name: string
  content: string
  count: number
  enabled: boolean
  note: string
  priority: number
  createdAt: number
  updatedAt: number
}

export type SortKey = keyof Pick<AdItem, "name" | "domain" | "origin" | "source" | "priority" | "enabled" | "createdAt">
export type SortDir = "asc" | "desc"

export const EMPTY_FORM = { name: "", source: "", domain: "", origin: "", content: "", note: "", priority: 0, enabled: true }

export function useAdCreatives() {
  const [items, setItems]             = useState<AdItem[]>([])
  const [loading, setLoading]         = useState(true)
  const [refreshing, setRefreshing]   = useState(false)
  const [fetchedAt, setFetchedAt]     = useState<number | null>(null)
  
  const [websiteOrigins, setWebsiteOrigins] = useState<string[]>([])

  const [search, setSearch]           = useState("")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [domainFilter, setDomainFilter] = useState("all")
  const [enabledFilter, setEnabledFilter] = useState<"all"|"enabled"|"disabled">("all")
  const [sortKey, setSortKey]         = useState<SortKey>("name")
  const [sortDir, setSortDir]         = useState<SortDir>("asc")

  // Panel state
  const [selected, setSelected]       = useState<AdItem | null>(null)
  const [editing, setEditing]         = useState(false)
  const [editForm, setEditForm]       = useState<AdItem | null>(null)
  const [saving, setSaving]           = useState(false)

  // Add panel
  const [addOpen, setAddOpen]         = useState(false)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [submitting, setSubmitting]   = useState(false)

  const fetchData = useCallback(async (force = false) => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/ad-creatives${force ? "?force=true" : ""}`)
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setItems(data.items || [])
      if (data.fetchedAt) setFetchedAt(data.fetchedAt)
    } catch {
      toast.error("Failed to load Ad Creatives")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const fetchWebsiteOrigins = useCallback(async () => {
    try {
      const res = await fetch("/api/websites")
      if (!res.ok) return
      const data = await res.json()
      
      const origins = new Set<string>()
      const getOrigin = (domain: string) => domain.split(".").slice(-2).join(".")
      
      if (data.blogs) data.blogs.forEach((b: { blogDns: string }) => origins.add(getOrigin(b.blogDns)))
      if (data.wraps) data.wraps.forEach((w: { target_host: string }) => origins.add(getOrigin(w.target_host)))
      if (data.quotas) {
        data.quotas.forEach((q: { type: string, domain: string }) => {
          if (q.type === 'origin') origins.add(q.domain)
          else origins.add(getOrigin(q.domain))
        })
      }
      
      setWebsiteOrigins(Array.from(origins).sort())
    } catch (err) {
      console.error("Failed to fetch website origins", err)
    }
  }, [])

  useEffect(() => { 
    fetchData()
    fetchWebsiteOrigins()
  }, [fetchData, fetchWebsiteOrigins])

  const sources = useMemo(() =>
    ["all", ...Array.from(new Set(items.map(i => i.source).filter(Boolean)))].sort(),
    [items]
  )

  const domainsInUI = useMemo(() =>
    ["all", ...Array.from(new Set(items.map(i => i.domain).filter(Boolean)))].sort(),
    [items]
  )

  const sorted = useMemo(() => {
    let list = [...items]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.domain.toLowerCase().includes(q) ||
        i.source.toLowerCase().includes(q) ||
        i.note.toLowerCase().includes(q)
      )
    }
    if (sourceFilter !== "all") list = list.filter(i => i.source === sourceFilter)
    if (domainFilter !== "all") list = list.filter(i => i.domain === domainFilter)
    if (enabledFilter === "enabled")  list = list.filter(i => i.enabled)
    if (enabledFilter === "disabled") list = list.filter(i => !i.enabled)
    
    list.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (av < bv) return sortDir === "asc" ? -1 : 1
      if (av > bv) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return list
  }, [items, search, sourceFilter, domainFilter, enabledFilter, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("asc") }
  }

  const handlePageSave = async () => {
    if (!editForm) return
    setSaving(true)
    try {
      const res = await fetch("/api/ad-creatives", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Saved successfully")
      await fetchData(true)
      setSelected(editForm)
      setEditing(false)
      setEditForm(null)
    } catch {
      toast.error("Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.domain || !form.content) {
      toast.error("Name, Domain and Content are required")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/ad-creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Creative added")
      setForm(EMPTY_FORM)
      setAddOpen(false)
      fetchData(true)
    } catch {
      toast.error("Failed to add creative")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/ad-creatives?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error(await res.text())
      toast.success("Deleted successfully")
      await fetchData(true)
      setSelected(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setRefreshing(false)
    }
  }

  return {
    items, loading, refreshing, fetchedAt, websiteOrigins,
    search, setSearch, sourceFilter, setSourceFilter,
    domainFilter, setDomainFilter, enabledFilter, setEnabledFilter,
    sortKey, sortDir, handleSort,
    selected, setSelected, editing, setEditing, editForm, setEditForm, saving,
    addOpen, setAddOpen, form, setForm, submitting,
    sources, domainsInUI, sorted,
    fetchData, handlePageSave, handleAddSubmit, handleDelete
  }
}

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import type {
  OriginDocument,
  OriginListItem,
  OriginPatchSection,
} from "@/types/origin"

export function useOriginConfig() {
  const [origins, setOrigins] = useState<OriginListItem[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [origin, setOrigin] = useState<OriginDocument | null>(null)
  const [loadingOrigin, setLoadingOrigin] = useState(false)
  const [savingSection, setSavingSection] = useState<OriginPatchSection | null>(null)

  const loadOrigin = useCallback(async (id: string) => {
    if (!id) {
      setOrigin(null)
      setSelectedId("")
      return
    }
    try {
      setLoadingOrigin(true)
      setSelectedId(id)
      const res = await fetch(`/api/origins/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load origin")
      setOrigin(data.item)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load origin"
      toast.error(message)
      setOrigin(null)
    } finally {
      setLoadingOrigin(false)
    }
  }, [])

  const loadList = useCallback(async (preserveSelected = true) => {
    try {
      setListLoading(true)
      const res = await fetch("/api/origins")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to load origins")
      const items: OriginListItem[] = data.items || []
      setOrigins(items)

      if (items.length > 0) {
        setSelectedId((current) => {
          if (!preserveSelected || !current || !items.some((i) => i._id === current)) {
            const dailySport = items.find((i) => i.origin === "dailysportnews.online")
            const target = dailySport || items[0]
            void loadOrigin(target._id)
            return target._id
          }
          return current
        })
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load origins"
      toast.error(message)
    } finally {
      setListLoading(false)
    }
  }, [loadOrigin])

  useEffect(() => {
    void loadList(false)
  }, [loadList])

  const updateOrigin = useCallback((updater: (prev: OriginDocument) => OriginDocument) => {
    setOrigin((prev) => (prev ? updater(prev) : prev))
  }, [])

  const saveSection = useCallback(
    async (section: OriginPatchSection, data: unknown) => {
      if (!origin?._id) return
      try {
        setSavingSection(section)
        const res = await fetch(`/api/origins/${origin._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section, data }),
        })
        const payload = await res.json()
        if (!res.ok) throw new Error(payload.error || "Save failed")
        setOrigin(payload.item)
        setOrigins((prev) =>
          prev.map((item) =>
            item._id === payload.item._id
              ? {
                  ...item,
                  origin: payload.item.origin,
                  icon: payload.item.icon || item.icon,
                  updatedAt: payload.item.updatedAt,
                  enabledAds: Boolean(payload.item.config?.enabledAds),
                }
              : item,
          ),
        )
        toast.success("Changes saved successfully")
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Failed to save changes"
        toast.error(message)
        throw error
      } finally {
        setSavingSection(null)
      }
    },
    [origin?._id],
  )

  const filteredOrigins = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return origins
    return origins.filter((item) => item.origin.toLowerCase().includes(q))
  }, [origins, query])

  return {
    origins,
    filteredOrigins,
    listLoading,
    query,
    setQuery,
    selectedId,
    origin,
    setOrigin,
    updateOrigin,
    loadingOrigin,
    savingSection,
    loadList,
    loadOrigin,
    saveSection,
  }
}

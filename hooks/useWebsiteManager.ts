import { useState, useEffect, useMemo, useCallback } from "react"
import { toast } from "sonner"

export interface Blog {
    _id: string; blogDns: string; blogEmail: string; blogIndex: number
    blogPassword: string; blogPriority: number; blogUser: string
    channel: string; enabled: boolean; wrapDomain: string
    createdAt: number; updatedAt: number
}
export interface Wrap {
    _id: string; prefix: string; wrap_host: string
    target_host: string; createdAt: number; updatedAt: number
}
export interface Quota {
    _id: string; count: number; date: string; domain: string
    key: string; limit: number; type: string
    createdAt: number; updatedAt: number
}
export interface QuotaGroup {
    domain: string
    type: string
    latest: Quota
    history: Quota[]
}
export type TabKey = "blogs" | "wraps" | "quotas"
export type SelectedItem = { tab: TabKey; data: Blog | Wrap | QuotaGroup }

export function useWebsiteManager() {
    const [blogs, setBlogs] = useState<Blog[]>([])
    const [wraps, setWraps] = useState<Wrap[]>([])
    const [quotas, setQuotas] = useState<Quota[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [fetchedAt, setFetchedAt] = useState<number | null>(null)
    const [tab, setTab] = useState<TabKey>("blogs")
    const [search, setSearch] = useState("")
    const [originFilter, setOriginFilter] = useState("all")
    const [channelFilter, setChannelFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [dateFilter, setDateFilter] = useState("all")
    const [hasInitializedDate, setHasInitializedDate] = useState(false)
    const [selected, setSelected] = useState<SelectedItem | null>(null)
    const [mounted, setMounted] = useState(false)

    const fetchData = useCallback(async (force = false) => {
        try {
            setRefreshing(true)
            const res = await fetch(`/api/websites${force ? "?force=true" : ""}`)
            if (!res.ok) throw new Error(await res.text())
            const d = await res.json()
            setBlogs(d.blogs || [])
            setWraps(d.wraps || [])
            setQuotas(d.quotas || [])
            if (d.fetchedAt) setFetchedAt(d.fetchedAt)
        } catch { toast.error("Failed to load Website Manager data") }
        finally { setLoading(false); setRefreshing(false) }
    }, [])

    useEffect(() => {
        setMounted(true)
        void fetchData()
    }, [fetchData])

    const copyToClipboard = async (text: string, label: string) => {
        await navigator.clipboard.writeText("")
        await navigator.clipboard.writeText(text)
        toast.success(`Copied ${label}`)
    }

    const getOrigin = (domain: string) => domain.split(".").slice(-2).join(".")

    const isFromOrigin = (domain: string, origin: string) => {
        if (origin === "all") return true
        return domain === origin || domain.endsWith("." + origin)
    }

    const filteredBlogs = useMemo(() => blogs.filter(b => {
        const matchSearch = !search || b.blogDns.toLowerCase().includes(search.toLowerCase()) || b.blogUser.toLowerCase().includes(search.toLowerCase()) || (b.channel && b.channel.toLowerCase().includes(search.toLowerCase()))
        const matchOrigin = originFilter === "all" || getOrigin(b.blogDns) === originFilter
        const matchChannel = channelFilter === "all" 
            || (channelFilter === "Empty Channel" && !b.channel)
            || b.channel === channelFilter
        const matchStatus = statusFilter === "all"
            || (statusFilter === "enabled" && b.enabled)
            || (statusFilter === "disabled" && !b.enabled)
        return matchSearch && matchOrigin && matchChannel && matchStatus
    }), [blogs, search, originFilter, channelFilter, statusFilter])

    const filteredWraps = useMemo(() => wraps.filter(w => {
        const matchSearch = !search || w.wrap_host.toLowerCase().includes(search.toLowerCase()) || w.target_host.toLowerCase().includes(search.toLowerCase()) || w.prefix.toLowerCase().includes(search.toLowerCase())
        const matchOrigin = originFilter === "all" || getOrigin(w.target_host) === originFilter
        return matchSearch && matchOrigin
    }), [wraps, search, originFilter])

    const originQuotas = useMemo(() => quotas.filter(q => q.type === "origin"), [quotas])

    const allSubdomainGroups = useMemo<QuotaGroup[]>(() => {
        const subQuotas = quotas.filter(q => q.type === "subdomain")
        const map = new Map<string, Quota[]>()
        subQuotas.forEach(qt => {
            const arr = map.get(qt.domain) || []
            arr.push(qt)
            map.set(qt.domain, arr)
        })
        const groups: QuotaGroup[] = []
        map.forEach((recs, domain) => {
            const sorted = [...recs].sort((a, b) => b.date.localeCompare(a.date))
            groups.push({
                domain,
                type: sorted[0].type,
                latest: sorted[0],
                history: [...recs].sort((a, b) => a.date.localeCompare(b.date)),
            })
        })
        return groups
    }, [quotas])

    const allOriginNames = useMemo(() => {
        const fromOrigins = originQuotas.map(q => q.domain)
        const fromSubdomains = allSubdomainGroups.map(g => getOrigin(g.domain))
        return Array.from(new Set([...fromOrigins, ...fromSubdomains])).sort()
    }, [originQuotas, allSubdomainGroups])

    const allDates = useMemo(() => {
        const dates = Array.from(new Set(quotas.filter(q => q.type === 'subdomain').map(q => q.date))).sort().reverse()
        return dates
    }, [quotas])

    useEffect(() => {
        if (allDates.length > 0 && !hasInitializedDate) {
            setDateFilter(allDates[0])
            setHasInitializedDate(true)
        }
    }, [allDates, hasInitializedDate])

    const originHistory = useMemo(() => {
        const dates = [...allDates].reverse().slice(-10)
        return dates.map(date => {
            const dayData: Record<string, number | string> = { date: date.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3") }
            allOriginNames.forEach(name => {
                dayData[`origin_${name}`] = 0
            })
            const recs = originQuotas.filter(q => q.date === date)
            let dayTotal = 0
            recs.forEach(r => {
                const key = `origin_${r.domain}`
                dayData[key] = (Number(dayData[key]) || 0) + r.count
                dayTotal += r.count
            })
            dayData.total = dayTotal
            return dayData
        })
    }, [originQuotas, allDates, allOriginNames])

    const filteredGroups = useMemo(() => {
        return allSubdomainGroups
            .map(g => {
                if (dateFilter !== "all") {
                    const matched = g.history.find(r => r.date === dateFilter)
                    if (!matched) return null
                    return { ...g, latest: matched }
                }
                return g
            })
            .filter((g): g is QuotaGroup => {
                if (!g) return false
                const matchSearch = g.domain.toLowerCase().includes(search.toLowerCase()) || g.type.toLowerCase().includes(search.toLowerCase())
                const matchOrigin = isFromOrigin(g.domain, originFilter)
                return matchSearch && matchOrigin
            })
    }, [allSubdomainGroups, search, originFilter, dateFilter])

    const counts = useMemo(() => ({
        blogs: blogs.length,
        wraps: wraps.length,
        quotas: allSubdomainGroups.length
    }), [blogs.length, wraps.length, allSubdomainGroups.length])

    const filteredCounts = useMemo(() => ({
        blogs: filteredBlogs.length,
        wraps: filteredWraps.length,
        quotas: filteredGroups.length
    }), [filteredBlogs.length, filteredWraps.length, filteredGroups.length])

    const originList = useMemo(() => ["all", ...allOriginNames], [allOriginNames])

    const allChannels = useMemo(() => {
        const channels = Array.from(new Set(blogs.map(b => b.channel).filter(Boolean))).sort()
        return ["all", ...channels, "Empty Channel"]
    }, [blogs])

    const todayStr = useMemo(() =>
        new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).replace(/-/g, ""),
        [])

    return {
        blogs, wraps, allSubdomainGroups, loading, refreshing, fetchedAt, tab, setTab,
        search, setSearch, originFilter, setOriginFilter, channelFilter, setChannelFilter,
        statusFilter, setStatusFilter, dateFilter, setDateFilter, selected, setSelected,
        mounted, fetchData, copyToClipboard, filteredBlogs, filteredWraps, filteredGroups,
        allOriginNames, allDates, originHistory, counts, filteredCounts, originList,
        allChannels, todayStr
    }
}

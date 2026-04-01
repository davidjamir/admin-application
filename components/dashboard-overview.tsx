"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OverviewChart } from "@/components/overview-chart"
import { BusinessSystemOverview } from "@/components/business-system-overview"
import { QueueOverview } from "@/components/queue-overview"
import { SystemVitals } from "@/components/system-vitals"
// import { CommandCenter } from "@/components/command-center"
import { RefreshCcw, Facebook, BookOpen, FileText, Activity } from "lucide-react"
import { LoadingScreen } from "./ui/loading-screen"
import { Button } from "@/components/ui/button"
import { Area, AreaChart, ResponsiveContainer } from "recharts"

interface DashboardStats {
  summary: {
    totalPages: number
    activeBlogs: number
    totalAds: number
    queueBacklog: number
  }
  queues: {
    crawl: number
    news: number
    social: number
  }
  sources: { name: string; count: number }[]
  channels: { name: string; count: number }[]
  chartData: Record<string, string | number>[]
  businesses: {
    total: number
    users: number
    distribution: { id: string; name: string; count: number }[]
  }
  fetchedAt: number
}

const DOMAINS = [
  { name: "Total posts", color: "#3b82f6" },
  { name: "Active sites", color: "#8b5cf6" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    } as const,
  },
}

interface StatCardProps {
  title: string
  icon: React.ElementType
  value: number
  desc: string
  trend: number
  data: { val: number }[]
  color: { bg: string; text: string; hex: string }
}

function StatCard({ title, icon: Icon, value, desc, trend, data, color }: StatCardProps) {
  return (
    <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group">
      <Card 
        className="glass-premium rounded-3xl overflow-hidden transition-all duration-500 bg-mesh-blue border"
        style={{ borderColor: `${color.hex}44`, borderWidth: '1px' }}
      >
        <CardContent className="p-0">
          <div className="px-4 pt-2 pb-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-2xl ${color.bg} ${color.text} inner-glow`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[13px] font-medium text-black dark:text-white tracking-tight">
                  {title}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold ${trend >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {trend >= 0 ? "+" : ""}{trend}%
                </span>
                <span className="text-[9px] text-muted-foreground/40 font-medium">vs last sync</span>
              </div>
            </div>
            <div className="space-y-0.5 flex flex-col items-center justify-center py-0.5">
              <h3 className="text-3xl font-bold tracking-tight text-foreground/90 tabular-nums">
                {value.toLocaleString()}
              </h3>
              <p className="text-[10px] text-muted-foreground/50 font-medium lowercase">
                {desc}
              </p>
            </div>
          </div>
          <div className="h-10 w-full opacity-40 group-hover:opacity-80 transition-opacity duration-700">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id={`gradient-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color.hex} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color.hex} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={color.hex}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#gradient-${title.replace(/\s+/g, '')})`}
                  isAnimationActive={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async (force = false) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/stats${force ? "?force=true" : ""}`)
      if (!res.ok) throw new Error("Failed to fetch dashboard stats")
      const data = await res.json()
      // Inject detailed domain-level mock data to match the "Website Manager" visual reference
      if (data.chartData && data.chartData.length > 0) {
        data.chartData = data.chartData.map((d: { name: string }) => {
          const entry: Record<string, string | number> = { name: d.name }
          DOMAINS.forEach((domain) => {
            entry[domain.name] = domain.name === 'Total posts' 
              ? Math.floor(Math.random() * 200) + 700 
              : Math.floor(Math.random() * 50) + 150
          })
          return entry
        })
      }
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading && !stats) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-destructive font-medium italic">{error}</p>
        <Button onClick={() => fetchStats(true)} variant="outline" className="rounded-full">
          Retry Sync
        </Button>
      </div>
    )
  }

  if (!stats) return null

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2 mt-0"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white/[0.02] py-2.5 px-4 rounded-3xl border border-white/5">
        <div className="flex items-baseline gap-4">
          <h2 className="text-4xl font-medium tracking-tight text-black dark:text-white">
            Dash Board
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-muted-foreground/60 italic">
              Last Sync: {new Date(stats.fetchedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}, {new Date(stats.fetchedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fetchStats(true)}
              className={`rounded-full h-6 w-6 transition-all cursor-pointer ${loading ? "bg-green-500/20" : "hover:bg-green-500/5"}`}
              disabled={loading}
            >
              <RefreshCcw className={`h-3 w-3 transition-colors ${loading ? "text-green-600 animate-spin" : "text-green-500/70"}`} />
            </Button>
          </div>
        </div>
        <div className="hidden md:block">
          <SystemVitals variant="compact" />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { 
            title: "Facebook Pages", 
            icon: Facebook, 
            value: stats.summary.totalPages, 
            desc: `from ${stats.sources.length} sources`, 
            trend: 12,
            color: { bg: "bg-blue-500/10", text: "text-blue-500", hex: "#3b82f6" },
            data: Array.from({ length: 10 }, () => ({ val: Math.floor(Math.random() * 20) + 40 }))
          },
          { 
            title: "Active Blogs", 
            icon: BookOpen, 
            value: stats.summary.activeBlogs, 
            desc: "managed domains", 
            trend: 4,
            color: { bg: "bg-purple-500/10", text: "text-purple-500", hex: "#a855f7" },
            data: Array.from({ length: 10 }, () => ({ val: Math.floor(Math.random() * 15) + 30 }))
          },
          { 
            title: "Ad Templates", 
            icon: FileText, 
            value: stats.summary.totalAds, 
            desc: "ready to sync", 
            trend: -2,
            color: { bg: "bg-amber-500/10", text: "text-amber-500", hex: "#f59e0b" },
            data: Array.from({ length: 10 }, () => ({ val: Math.floor(Math.random() * 25) + 50 }))
          },
          { 
            title: "Queue Backlog", 
            icon: Activity, 
            value: stats.summary.queueBacklog, 
            desc: "pending items", 
            trend: 28,
            color: { bg: "bg-rose-500/10", text: "text-rose-500", hex: "#f43f5e" },
            data: Array.from({ length: 10 }, () => ({ val: Math.floor(Math.random() * 30) + 20 }))
          },
        ].map((item, id) => (
          <StatCard key={id} {...item} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants} className="col-span-1">
          <Card className="glass-pane overflow-hidden h-full border-r border-y border-l-0 border-blue-500/10">
            <CardHeader className="pb-4 pt-6 px-6 relative z-10">
              <CardTitle className="text-2xl font-medium text-black dark:text-white tracking-tighter">
                Website Posts Activity
              </CardTitle>
              <CardDescription className="text-[11px] font-medium text-muted-foreground/60">
                Article publishing activity from <span className="font-bold text-foreground/80">21 March 2026</span> to <span className="font-bold text-foreground/80">27 March 2026</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <OverviewChart data={stats.chartData} />
            </CardContent>
          </Card>
        </motion.div>
        
        <div className="col-span-1">
          <motion.div variants={itemVariants} className="h-full">
            <BusinessSystemOverview stats={stats.businesses} />
          </motion.div>
        </div>
      </div>

      <QueueOverview 
        queues={stats.queues} 
        fetchedAt={stats.fetchedAt} 
        onRefresh={() => fetchStats(true)} 
      />
    </motion.div>
  )
}

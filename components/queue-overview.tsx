"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  Calendar, 
  Share2, 
  TrendingUp, 
  Activity, 
  Layout, 
  Cpu, 
  RefreshCcw 
} from "lucide-react"

interface QueueStats {
  crawl: number
  news: number
  social: number
}

interface QueueOverviewProps {
  queues: QueueStats
  fetchedAt: number
  onRefresh?: () => void
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } as const }
}

export function QueueOverview({ queues, fetchedAt, onRefresh }: QueueOverviewProps) {
  const [timeLeft, setTimeLeft] = useState(60)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = Date.now()
      const diff = Math.floor((now - fetchedAt) / 1000)
      const remaining = Math.max(0, 60 - (diff % 60))
      setTimeLeft(remaining)
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [fetchedAt])

  const progress = (timeLeft / 60) * 100
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (progress / 100) * circumference

  const queueItems = [
    { label: "Crawl Engine", count: queues.crawl, icon: Database, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "News Sync", count: queues.news, icon: Layout, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Social Post", count: queues.social, icon: Share2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ]

  return (
    <motion.div variants={itemVariants} className="col-span-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-muted-foreground/40" />
          <h4 className="text-[11px] font-medium text-muted-foreground tracking-widest">Processing Pipelines</h4>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 pl-3 pr-1.5 py-0.5 rounded-full backdrop-blur-md">
           <span className="text-[9px] font-bold text-muted-foreground/60 tracking-tighter">Next Sync In {timeLeft}s</span>
           <div className="relative w-6 h-6 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="12" cy="12" r={radius} stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/5" />
                <circle
                  cx="12" cy="12" r={radius} stroke="currentColor" strokeWidth="2" fill="transparent"
                  strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                  className="text-emerald-500 transition-all duration-1000 ease-linear"
                />
              </svg>
              <RefreshCcw 
                onClick={onRefresh}
                className="absolute inset-0 m-auto w-2.5 h-2.5 text-muted-foreground/40 hover:text-emerald-500 cursor-pointer transition-colors" 
              />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {queueItems.map((item, i) => (
          <div key={i} className="glass-pane p-3 rounded-2xl flex items-center justify-between group hover:bg-white/[0.04] transition-all duration-500 border border-white/5">
            <div className="flex items-center gap-4">
              <div className={`p-2.5 rounded-xl ${item.bg} inner-glow transition-transform group-hover:scale-110 duration-500`}>
                <item.icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div>
                <div className="text-[10px] font-medium text-muted-foreground tracking-wider mb-0.5">{item.label}</div>
                <div className="text-2xl font-black text-black dark:text-white tabular-nums tracking-tighter">
                  {item.count.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="h-8 w-1 bg-white/5 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ height: 0 }}
                 animate={{ height: "60%" }}
                 className={`w-full ${item.bg.replace('/10', '/40')}`}
               />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}


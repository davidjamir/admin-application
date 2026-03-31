"use client"

import { useEffect, useState } from "react"
import { Database, Zap, Globe, Cpu, Loader2 } from "lucide-react"

interface VitalInfo {
  status: string
  latency: number
  load: string
}

interface HealthData {
  mongodb: VitalInfo
  redis: VitalInfo
  facebook: VitalInfo
  system: VitalInfo
}

interface SystemVitalsProps {
  variant?: "default" | "compact"
}

export function SystemVitals({ variant = "default" }: SystemVitalsProps) {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/dashboard/health")
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
      }
    } catch (err) {
      console.error("Health fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
    const interval = setInterval(fetchHealth, 600000) // Polling every 10 minutes
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className={`flex items-center justify-center ${variant === "compact" ? "h-6" : "h-[100px]"}`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
      </div>
    )
  }

  const vitals = [
    { name: "mongodb", status: data?.mongodb.status || "Checking", icon: Database, color: data?.mongodb.status === "Healthy" ? "text-emerald-500" : "text-rose-500", load: data?.mongodb.load || "..." },
    { name: "redis", status: data?.redis.status || "Checking", icon: Zap, color: data?.redis.status === "Active" ? "text-amber-500" : "text-rose-500", load: data?.redis.load || "..." },
    { name: "fb api", status: data?.facebook.status || "Checking", icon: Globe, color: data?.facebook.status === "Online" ? "text-blue-500" : "text-rose-500", load: data?.facebook.load || "..." },
    { name: "system", status: data?.system.status || "Checking", icon: Cpu, color: data?.system.status === "Healthy" ? "text-purple-500" : "text-rose-500", load: data?.system.load || "..." },
  ]

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-7 bg-white/[0.04] p-1.5 px-6 rounded-full border border-white/5 backdrop-blur-2xl">
        {vitals.map((v) => (
          <div key={v.name} className="flex items-center gap-3 group cursor-default transition-transform hover:scale-105">
            <div className="relative">
              <v.icon className={`h-4 w-4 ${v.color} opacity-100`} />
              <div className={`absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ${v.color.replace('text-', 'bg-')} border border-background animate-pulse`} />
            </div>
            <div className="flex flex-col -space-y-0.5">
              <span className={`text-[10px] font-medium ${v.color} opacity-100 leading-tight lowercase tracking-wide`}>{v.name}</span>
              <span className={`text-[10px] font-medium tabular-nums ${v.color} opacity-100 leading-tight`}>{v.load}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {vitals.map((v) => (
        <div key={v.name} className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
          <v.icon className={`h-6 w-6 ${v.color} mb-2`} />
          <p className="text-[10px] font-bold lowercase tracking-wider text-muted-foreground">{v.name}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <div className={`h-1.5 w-1.5 rounded-full ${v.color.replace('text-', 'bg-')} animate-pulse`} />
            <p className="text-[10px] font-medium">{v.load}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

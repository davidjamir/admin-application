"use client"

import { Button } from "@/components/ui/button"
import { RefreshCcw, DatabaseZap, HardDriveDownload, Sparkles } from "lucide-react"

export function CommandCenter() {
  const actions = [
    { name: "Flash Sync", icon: RefreshCcw, color: "text-blue-500" },
    { name: "Flush Cache", icon: DatabaseZap, color: "text-amber-500" },
    { name: "Sync Items", icon: HardDriveDownload, color: "text-purple-500" },
    { name: "Optimize", icon: Sparkles, color: "text-green-500" },
  ]
  
  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((v) => (
        <Button key={v.name} variant="ghost" className="flex items-center gap-2 px-3 py-1 text-sm h-9 bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
          <v.icon className={`h-4 w-4 ${v.color}`} />
          {v.name}
        </Button>
      ))}
    </div>
  )
}

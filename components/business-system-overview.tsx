"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Users, Briefcase, ChevronRight, Activity } from "lucide-react"

interface BusinessDistribution {
  id: string
  name: string
  count: number
}

interface BusinessSystemOverviewProps {
  stats: {
    total: number
    users: number
    distribution: BusinessDistribution[]
  }
}

export function BusinessSystemOverview({ stats }: BusinessSystemOverviewProps) {
  return (
    <Card className="glass-pane overflow-hidden h-full border-r border-y border-l-0 border-purple-500/10">
      <CardHeader className="pb-4 pt-6 px-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-medium text-black dark:text-white tracking-tighter flex items-center gap-2">
              Business Assets
            </CardTitle>
            <CardDescription className="text-[11px] font-medium text-muted-foreground/60">
              Aggregated overview of Business Managers and System Users
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-black dark:text-white">{stats.total}</span>
                <span className="text-[9px] text-muted-foreground font-bold tracking-widest">Bms</span>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-black dark:text-white">{stats.users}</span>
                <span className="text-[9px] text-muted-foreground font-bold tracking-widest">Users</span>
             </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6 pt-2">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 rounded-2xl bg-purple-500/5 border border-purple-500/10 inner-glow">
              <div className="flex items-center gap-2 mb-1">
                <Briefcase className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-[10px] font-medium text-purple-500/80">Business Units</span>
              </div>
              <div className="text-lg font-bold text-black dark:text-white">{stats.total}</div>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10 inner-glow">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-medium text-blue-500/80">Active Users</span>
              </div>
              <div className="text-lg font-bold text-black dark:text-white">{stats.users}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-medium text-muted-foreground tracking-widest">Collection Summary</h4>
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
            </div>
            
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
              {stats.distribution.length > 0 ? (
                stats.distribution.map((bm, i) => (
                  <div key={bm.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.03] border border-transparent hover:border-white/5 transition-all duration-300">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10 flex items-center justify-center border border-white/5 shrink-0">
                        <Users className="w-4 h-4 text-purple-500/60" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-foreground/90 truncate pr-2">
                          {bm.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground/50 font-mono">
                          ID: {bm.id}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-bold bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                        {bm.count} Users
                      </Badge>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-muted-foreground/50 transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-40">
                  <Briefcase className="w-8 h-8 mb-2" />
                  <p className="text-[11px] font-medium">No business data synchronized</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

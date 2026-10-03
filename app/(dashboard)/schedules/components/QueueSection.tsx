import React from "react"
import { Clock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { QueueSectionProps } from "./types"
import { Metric } from "./Metric"
import { QueueItemRecord } from "./QueueItemRecord"
import { AlertCircle, Layers, Share2, Database } from "lucide-react"

export const QueueSection: React.FC<QueueSectionProps> = ({ title, items, stats, icon, onCopy, type }) => {
  return (
    <div className="flex flex-col h-full min-h-0 text-black dark:text-white">
      <Card className="flex flex-col h-full bg-card border-border overflow-hidden transition-all duration-300">
        <CardHeader className="pb-4 border-b border-border/50 shrink-0 bg-muted/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 bg-card rounded-xl border border-border`}>
                {icon}
              </div>
              <div>
                <CardTitle className="text-xl font-bold tracking-tight text-black dark:text-white">{title}</CardTitle>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold tracking-widest uppercase opacity-80 flex items-center gap-1.5">
                      <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Running
                   </span>
                </div>
              </div>
            </div>
            <div className="text-right">
                <span className="text-2xl font-bold tabular-nums tracking-tight text-black dark:text-white">{stats?.total || 0}</span>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">Units</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             {type === 'crawl' ? (
                <>
                  <Metric label="Fails" value={stats?.fails || 0} icon={<AlertCircle className="size-3" />} highlight={stats?.fails > 0} />
                  <Metric label={Object.keys(stats?.types || {})?.[0] || 'Crawler'} value={(Object.values(stats?.types || {})?.[0] as string | number) || 0} icon={<Layers className="size-3" />} />
                </>
             ) : type === 'news' ? (
                <>
                  <Metric label="Vaulted" value={stats?.total || 0} icon={<Database className="size-3" />} />
                  <Metric label="State" value="Ready" icon={<Clock className="size-3" />} />
                </>
             ) : (
                <>
                  <Metric label="Distributing" value={stats?.total || 0} icon={<Share2 className="size-3" />} />
                  <Metric label="Pages" value={stats?.pages || 0} icon={<Database className="size-3" />} />
                </>
             )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-card">
          <div className="flex flex-col gap-2.5">
            {items && items.length > 0 ? (
              items.map((item) => (
                <QueueItemRecord key={item._id} item={item} type={type} onCopy={() => onCopy(item.itemId)} />
              ))
            ) : (
              <div className="py-24 text-center flex flex-col items-center justify-center gap-5">
                <div className="size-20 rounded-full bg-muted/40 flex items-center justify-center border border-border">
                    <Clock className="size-10 text-muted-foreground/40" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Queue Clear</p>
                  <p className="text-[11px] text-muted-foreground/60 italic">Standby for incoming node cluster.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


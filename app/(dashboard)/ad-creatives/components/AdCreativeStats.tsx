import React from "react"
import { AdCreativeStatsProps } from "./types"

export const AdCreativeStats: React.FC<AdCreativeStatsProps> = ({
  items
}) => {
  const stats = [
    { label: "Total",    value: items.length,                                color: "hsl(217,91%,50%)" },
    { label: "Enabled",  value: items.filter(i => i.enabled).length,        color: "hsl(142,71%,40%)" },
    { label: "Disabled", value: items.filter(i => !i.enabled).length,       color: "hsl(0,85%,45%)"   },
    { label: "Sources",  value: new Set(items.map(i => i.source).filter(Boolean)).size, color: "rgb(245, 159, 10)"  },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map(s => (
        <div key={s.label} className="flex items-center gap-3 p-3.5 rounded-xl border bg-card shadow-sm">
          <div className="text-2xl font-bold tabular-nums" style={{ color: s.color }}>
            {s.value}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider leading-tight">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

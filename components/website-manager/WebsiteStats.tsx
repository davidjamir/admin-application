import React from "react"
import { BookOpen, Link2, BarChart3 } from "lucide-react"
import { WebsiteStatsProps } from "./types"

export const WebsiteStats: React.FC<WebsiteStatsProps> = ({ tab, setTab, setSearch, counts }) => {
    const tabs = [
        { key: "blogs", label: "Blogs", icon: BookOpen, color: "hsl(217,91%,50%)" },
        { key: "wraps", label: "Wraps", icon: Link2, color: "hsl(142,71%,40%)" },
        { key: "quotas", label: "Quotas", icon: BarChart3, color: "hsl(38,92%,50%)" }
    ] as const

    return (
        <div className="grid grid-cols-3 gap-3">
            {tabs.map(({ key, label, icon: Icon, color }) => (
                <button 
                    key={key} 
                    onClick={() => { setTab(key); setSearch("") }}
                    className={`flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-card shadow-sm cursor-pointer hover:bg-muted/40 transition-colors text-left ${tab === key ? "ring-2 ring-primary/40" : ""}`}
                >
                    <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                        <div className="text-xl font-bold tabular-nums" style={{ color }}>
                        {counts[key]}
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
                    </div>
                </button>
            ))}
        </div>
    )
}

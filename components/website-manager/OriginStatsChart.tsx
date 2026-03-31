import React from "react"
import { BarChart3 } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer
} from "recharts"
import { OriginStatsChartProps } from "./types"

export const OriginStatsChart: React.FC<OriginStatsChartProps> = ({ 
    originHistory, allOriginNames, originFilter, setOriginFilter 
}) => {
    if (originHistory.length === 0) return null

    return (
        <div className="relative z-20 rounded-xl border border-border/40 bg-card shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                        <BarChart3 className="w-3.5 h-3.5" />
                        Origin Statistics (Last 10 Days)
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Daily post aggregated trend for all origins</div>
                </div>
            </div>

            <div className="h-[220px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={originHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.15}/>
                                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0}/>
                            </linearGradient>
                            {allOriginNames.map((name, i) => (
                                <linearGradient key={name} id={`color-${name}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={`hsl(${(i * 137) % 360}, 70%, 50%)`} stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor={`hsl(${(i * 137) % 360}, 70%, 50%)`} stopOpacity={0}/>
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                        <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                            tickFormatter={d => d.split("-").slice(1).join("/")}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis 
                            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} 
                            axisLine={false}
                            tickLine={false}
                        />
                        <RTooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const date = label;
                                    const items = payload
                                        .filter(p => p.dataKey !== 'total' && typeof p.value === 'number')
                                        .map(p => ({
                                            name: String(p.name),
                                            value: Number(p.value),
                                            color: String(p.color)
                                        }))
                                        .sort((a, b) => b.value - a.value);
                                    const total = payload.find(p => p.dataKey === 'total')?.value;
                                    return (
                                        <div className="bg-background border border-border/40 rounded-lg shadow-xl p-3 min-w-[180px] z-50">
                                            <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2 border-b border-border/40 pb-1">{date}</div>
                                            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                                                {items.map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between gap-4 text-[11px]">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                        <span className="font-medium truncate">{item.name}</span>
                                                        <span className="font-bold tabular-nums">{item.value}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-bold">
                                                <span>{originFilter === "all" ? "Total Posts" : "Posts Count"}</span>
                                                <span className={originFilter === "all" ? "text-primary" : ""}>
                                                    {originFilter === "all" ? (total || 0) : (payload[0]?.payload?.[`origin_${originFilter}`] || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone" dataKey="total" stroke="hsl(217, 91%, 60%)" strokeWidth={2}
                            fillOpacity={1} fill="url(#colorTotal)" name="Total" hide={originFilter !== "all"}
                            dot={{ r: 3, fill: "hsl(217, 91%, 60%)", strokeWidth: 0 }}
                            activeDot={{ r: 5, strokeWidth: 0 }}
                        />
                        {allOriginNames.map((name, i) => (
                            <Area
                                key={name} type="monotone" dataKey={`origin_${name}`}
                                stroke={`hsl(${(i * 137) % 360}, 60%, 45%)`} strokeWidth={1}
                                fillOpacity={1} fill={`url(#color-${name})`} name={name}
                                hide={originFilter !== "all" && originFilter !== name} connectNulls
                                dot={originFilter !== "all" ? { r: 2, fill: `hsl(${(i * 137) % 360}, 60%, 45%)`, strokeWidth: 0 } : false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        ))}
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {originFilter !== "all" && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                    <span className="text-xs text-muted-foreground italic">Filtering origins by parent domain</span>
                    <button onClick={() => setOriginFilter("all")} className="text-xs text-primary font-semibold hover:underline cursor-pointer">View All Origins</button>
                </div>
            )}
        </div>
    )
}

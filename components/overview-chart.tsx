"use client"

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

interface OverviewChartProps {
  data: Record<string, string | number>[]
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string; fill: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => b.value - a.value);
    const day = label?.includes('/') ? label.split('/')[1] : label?.replace(/[a-zA-Z]/g, '').trim();

    return (
      <div className="bg-white/98 dark:bg-[#0c0c0e] rounded-lg border border-border p-2 min-w-[140px] shadow-none ring-1 ring-black/5 backdrop-blur-xl">
        <div className="pb-1 mb-1 border-b border-border/40">
          <p className="text-[12px] font-bold text-black dark:text-white tracking-tight">
            Mar {day}, 2026
          </p>
        </div>
        
        <div className="space-y-0.5">
          {sortedPayload.map((item, index) => (
            <div key={index} className="flex items-center justify-between group gap-4">
              <div className="flex items-center gap-1.5 min-w-0">
                <div 
                  className="w-1 h-1 rounded-full shrink-0 opacity-80" 
                  style={{ backgroundColor: item.color || item.fill }} 
                />
                <span className="text-[11px] font-medium text-foreground/50 tracking-tight truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-[11px] font-medium text-foreground/80 tabular-nums shrink-0">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export function OverviewChart({ data }: OverviewChartProps) {
  /* const domainKeys = data.length > 0 
    ? Object.keys(data[0]).filter(k => k !== 'name') 
    : []; */

  return (
    <div className="w-full h-[350px] px-2 pt-4 pb-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={data} 
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="color-totalposts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="color-activesites" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 4"
            vertical={false}
            stroke="currentColor"
            opacity={0.03}
          />
          <XAxis
            dataKey="name"
            stroke="currentColor"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ opacity: 0.5, fontWeight: 500 }}
            tickMargin={12}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="currentColor"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            tick={{ opacity: 0.5, fontWeight: 500 }}
            tickMargin={8}
            tickFormatter={(value) => (value === 0 ? "" : value.toLocaleString())}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "currentColor", strokeWidth: 1, opacity: 0.05 }}
          />
          <Area
            key="Total posts"
            type="monotone"
            dataKey="Total posts"
            name="Total posts"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#color-totalposts)"
            animationDuration={2000}
            strokeLinecap="round"
            dot={{ r: 1.5, fill: "#3b82f6", strokeWidth: 1.5, stroke: "#fff" }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
          <Area
            key="Active sites"
            type="monotone"
            dataKey="Active sites"
            name="Active sites"
            stroke="#8b5cf6"
            strokeWidth={1}
            fillOpacity={1}
            fill="url(#color-activesites)"
            animationDuration={2500}
            strokeLinecap="round"
            dot={{ r: 1, fill: "#8b5cf6", strokeWidth: 1.5, stroke: "#fff" }}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

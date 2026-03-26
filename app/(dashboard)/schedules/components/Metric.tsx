import React from "react"
import { MetricProps } from "./types"

export const Metric: React.FC<MetricProps> = ({ label, value, icon, highlight = false }) => {
  return (
    <div className={`flex flex-col gap-1 p-2 rounded-md border bg-background/50 shadow-sm ${highlight ? 'border-rose-200 bg-rose-50/50 text-rose-600 dark:border-rose-900 dark:bg-rose-900/10' : ''}`}>
      <span className="text-[8px] font-bold uppercase tracking-widest leading-none opacity-60 flex items-center gap-1 text-black">
        {icon} {label}
      </span>
      <span className="text-xs font-bold uppercase tracking-tight tabular-nums leading-none text-black">
        {value}
      </span>
    </div>
  )
}

import React from "react"

export const CustomProgress = ({ value }: { value: number }) => (
  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 border-none mt-1 shadow-inner">
    <div 
      className="h-full bg-gradient-to-r from-emerald-300 to-emerald-400 transition-all duration-1000 ease-linear shadow-[0_0_8px_rgba(110,231,183,0.25)]"
      style={{ width: `${value}%` }}
    />
  </div>
);

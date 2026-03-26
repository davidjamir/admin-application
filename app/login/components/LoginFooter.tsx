import React from "react"

export const LoginFooter = () => {
  return (
    <div className="fixed bottom-0 left-0 w-full p-6 flex items-center justify-between bg-white dark:bg-black/40 border-t border-slate-200 dark:border-white/10 backdrop-blur-md z-20 pointer-events-none">
      <div className="flex items-center gap-6">
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Uptime</span>
          <span className="text-xs font-mono font-bold tracking-tighter text-black">99.998% UPTIME GUARANTEED</span>
        </div>
        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest leading-none mb-1">Traffic</span>
          <span className="text-xs font-mono font-bold tracking-tighter text-black">1.2 TB / MIN STABLE</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="size-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-black">Global Network Core : Active</span>
      </div>
    </div>
  )
}

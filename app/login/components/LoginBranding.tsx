import React from "react"
import { ShieldCheck, Zap, Globe } from "lucide-react"
import { Terminal } from "./Terminal"

export const LoginBranding = () => {
  return (
    <div className="flex flex-col space-y-8 animate-in slide-in-from-left-8 duration-1000 text-black">
      <div className="space-y-4 text-left">
        <div className="flex items-center gap-3 mb-2">
          <div className="size-12 bg-gradient-to-tr from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-xl">
            <ShieldCheck className="size-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase italic text-black">
              7 FORGE <span className="text-primary not-italic">INC</span>
            </h2>
            <p className="text-[10px] font-bold tracking-[0.3em] text-slate-400 dark:text-white/30 uppercase leading-none">
              Security Operations Center
            </p>
          </div>
        </div>
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent text-left">
          Powering <br /> Advanced <br /> <span className="text-primary underline decoration-primary/20">Media Tech.</span>
        </h1>
      </div>

      <Terminal />

      <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-white/20">
        <span className="flex items-center gap-1.5"><Zap className="size-3 text-primary" /> Low Latency</span>
        <span className="flex items-center gap-1.5"><Globe className="size-3 text-blue-500" /> Global Edge</span>
      </div>
    </div>
  )
}

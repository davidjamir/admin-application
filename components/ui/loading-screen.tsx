"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface LoadingScreenProps {
  message?: string
  fullScreen?: boolean
}

export function LoadingScreen({ message = "Admin System", fullScreen = true }: LoadingScreenProps) {
  return (
    <div className={`flex ${fullScreen ? "h-[80vh]" : "h-full py-12"} items-center justify-center flex-col gap-8`}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative flex flex-col items-center gap-6"
      >
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-t-2 border-primary animate-spin opacity-40"></div>
          <div className="absolute inset-0 rounded-full border-r-2 border-primary/30 animate-spin [animation-duration:1.5s]"></div>
          <div className="absolute inset-4 bg-primary/10 rounded-full animate-pulse flex items-center justify-center">
            <span className="text-primary font-black text-xl italic tracking-tighter select-none">
              7
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1.5 overflow-hidden">
          <h1 className="text-2xl font-black tracking-[0.2em] text-black dark:text-white select-none">
            7 Forge Inc
          </h1>
          <div className="flex items-center gap-3">
            <span className="h-[1px] w-8 bg-primary/20"></span>
            <p className="text-[10px] font-medium text-muted-foreground/40 tracking-[0.4em] animate-pulse">
              {message}
            </p>
            <span className="h-[1px] w-8 bg-primary/20"></span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

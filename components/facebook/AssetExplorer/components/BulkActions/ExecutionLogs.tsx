import React from "react"
import { Button } from "@/components/ui/button"
import { History, Copy, CheckCircle2, AlertCircle } from "lucide-react"
import { ResponseItem } from "@/hooks/useBulkActions"
import { cn } from "@/lib/utils"

interface ExecutionLogsProps {
  responses: ResponseItem[]
  handleCopyLogs: () => void
}

export function ExecutionLogs({ responses, handleCopyLogs }: ExecutionLogsProps) {
  if (responses.length === 0) return null

  return (
    <div className="pt-4 border-t border-dashed border-border/50 space-y-3">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground">
            <History className="w-3.5 h-3.5" /> Execution Log
         </div>
         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyLogs}>
            <Copy className="w-3 h-3" />
         </Button>
      </div>
      
      <div className="max-h-[200px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
         {responses.map((resp, idx) => (
            <div key={idx} className={cn(
              "flex items-start gap-2.5 p-2 rounded-lg border text-[10px] font-mono",
              resp.status === "success" ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-600/80" : "bg-destructive/5 border-destructive/10 text-destructive/80"
            )}>
              {resp.status === "success" ? <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" /> : <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />}
              <div className="break-all">
                <span className="font-bold">{resp.id}</span>: {resp.message}
              </div>
            </div>
         ))}
      </div>
    </div>
  )
}

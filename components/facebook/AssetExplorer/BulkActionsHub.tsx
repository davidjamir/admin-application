'use client'

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  Share2, 
  UserPlus, 
  UserMinus, 
  Trash2, 
  Plus,
  Loader2,
  Copy,
  History,
  CheckCircle2,
  AlertCircle,
  Command
} from "lucide-react"
import { toast } from "sonner"
import { facebookService } from "@/services/facebook.service"
import { FacebookBusiness, SystemUser } from "@/types/facebook"
import { cn } from "@/lib/utils"

type ActionType = 
  | "share-other-bm" 
  | "add-current-bm" 
  | "assign-user-current-bm" 
  | "remove-user-current-bm" 
  | "remove-page-current-bm"

type ResponseItem = {
  id: string
  status: "success" | "failed"
  message: string
}

type Props = {
  selectedPageIds: string[]
  activeToken: string
  activeViewerId: string
  businesses: FacebookBusiness[]
  systemUsers: SystemUser[]
  onSuccess: () => void
}

export default function BulkActionsHub({ 
  selectedPageIds, 
  activeToken, 
  activeViewerId,
  businesses,
  systemUsers,
  onSuccess
}: Props) {
  const [action, setAction] = useState<ActionType>("assign-user-current-bm")
  const [targetBmId, setTargetBmId] = useState("")
  const [targetSystemUserId, setTargetSystemUserId] = useState("")
  const [taskMode, setTaskMode] = useState<"basic" | "full">("basic")
  const [processing, setProcessing] = useState(false)
  const [responses, setResponses] = useState<ResponseItem[]>([])

  // Auto-select defaults
  useEffect(() => {
    if (!targetBmId && businesses.length > 0) setTargetBmId(businesses[0].id)
  }, [businesses, targetBmId])

  useEffect(() => {
    if (!targetSystemUserId && systemUsers.length > 0) setTargetSystemUserId(systemUsers[0].id)
  }, [systemUsers, targetSystemUserId])

  const executeAction = async () => {
    if (selectedPageIds.length === 0) {
      toast.error("Resource error: No assets selected for execution")
      return
    }

    if (!targetBmId && !["remove-user-current-bm"].includes(action)) {
      toast.error("Context error: Target Business must be specified")
      return
    }

    if (["assign-user-current-bm", "remove-user-current-bm"].includes(action) && !targetSystemUserId) {
      toast.error("Identity error: Target User must be specified")
      return
    }
    
    try {
      setProcessing(true)
      let result: { successPageIds: string[]; failed: { pageId: string; message: string }[] }

      switch (action) {
        case "share-other-bm":
          result = await facebookService.sharePagesToBusinessByAgencies(selectedPageIds, targetBmId, activeToken, taskMode)
          break
        case "add-current-bm":
          result = await facebookService.addPagesToBusinessOwnedPagesBatch(selectedPageIds, targetBmId, activeToken)
          break
        case "assign-user-current-bm":
          result = await facebookService.assignUserToPagesByBusinessAssignedUsersBatch(selectedPageIds, targetBmId, targetSystemUserId, activeToken, taskMode)
          break
        case "remove-user-current-bm":
          result = await facebookService.removeSystemUserFromPagesByPageAssignedUsersBatch(selectedPageIds, targetSystemUserId, activeToken)
          break
        case "remove-page-current-bm":
          result = await facebookService.removePagesFromBusinessBatch(selectedPageIds, targetBmId, activeToken)
          break
        default:
          throw new Error("Invalid action protocol")
      }

      const newResponses = [
        ...result.successPageIds.map(id => ({ id, status: "success" as const, message: "Operation validated" })),
        ...result.failed.map(f => ({ id: f.pageId, status: "failed" as const, message: f.message }))
      ]
      
      setResponses(newResponses)
      if (result.failed.length === 0) toast.success(`Command executed on ${result.successPageIds.length} assets`)
      else toast.error(`Partial failure: ${result.failed.length} nodes rejected command`)
      
      onSuccess()
    } catch (err) {
      toast.error("Critical execution error")
    } finally {
      setProcessing(false)
    }
  }

  const handleCopyLogs = () => {
    const text = responses.map(r => `[${r.status.toUpperCase()}] ${r.id}: ${r.message}`).join("\n")
    navigator.clipboard.writeText(text)
    toast.success("Execution logs copied")
  }

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl sticky top-6">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Action Control Hub</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono opacity-60">
              Targets: {selectedPageIds.length} Assets
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <div className="space-y-4">
           <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Protocol Type</label>
              <Select value={action} onValueChange={(v) => setAction(v as ActionType)}>
                <SelectTrigger className="h-10 bg-background/50 border-border/50 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assign-user-current-bm" className="text-xs">
                    <div className="flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> Assign to User</div>
                  </SelectItem>
                  <SelectItem value="remove-user-current-bm" className="text-xs">
                    <div className="flex items-center gap-2"><UserMinus className="w-3.5 h-3.5" /> Remove from User</div>
                  </SelectItem>
                  <SelectItem value="share-other-bm" className="text-xs">
                    <div className="flex items-center gap-2"><Share2 className="w-3.5 h-3.5" /> Share to other BM</div>
                  </SelectItem>
                  <SelectItem value="add-current-bm" className="text-xs">
                    <div className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> Add to current BM</div>
                  </SelectItem>
                  <SelectItem value="remove-page-current-bm" className="text-xs text-destructive">
                    <div className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Remove asset from BM</div>
                  </SelectItem>
                </SelectContent>
              </Select>
           </div>

           <div className="space-y-3 p-4 bg-muted/30 border border-border/40 rounded-xl">
              {action !== "remove-user-current-bm" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Business (Context)</label>
                  <Select value={targetBmId} onValueChange={setTargetBmId}>
                    <SelectTrigger className="h-9 bg-background/50 border-border/50 text-xs">
                      <SelectValue placeholder="Select BM..." />
                    </SelectTrigger>
                    <SelectContent>
                      {businesses.map(bm => <SelectItem key={bm.id} value={bm.id} className="text-xs">{bm.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {["assign-user-current-bm", "remove-user-current-bm"].includes(action) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Target Identity (User)</label>
                  <Select value={targetSystemUserId} onValueChange={setTargetSystemUserId}>
                    <SelectTrigger className="h-9 bg-background/50 border-border/50 text-xs">
                      <SelectValue placeholder="Select User..." />
                    </SelectTrigger>
                    <SelectContent>
                      {systemUsers.map(u => (
                         <SelectItem key={u.id} value={u.id} className="text-xs">
                           {u.name} • {u.businessName || "No BM"}
                         </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {["assign-user-current-bm", "share-other-bm"].includes(action) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Authority Level</label>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={taskMode === "basic" ? "default" : "outline"}
                      onClick={() => setTaskMode("basic")}
                      className="flex-1 h-8 text-[10px] uppercase font-bold"
                    >Basic Access</Button>
                    <Button 
                      size="sm" 
                      variant={taskMode === "full" ? "default" : "outline"}
                      onClick={() => setTaskMode("full")}
                      className="flex-1 h-8 text-[10px] uppercase font-bold"
                    >Full Hierarchy</Button>
                  </div>
                </div>
              )}
           </div>

           <Button 
             onClick={executeAction} 
             disabled={processing || selectedPageIds.length === 0}
             className="w-full h-11 cursor-pointer font-bold shadow-lg shadow-primary/10"
           >
             {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Command className="w-4 h-4 mr-2" />}
             {processing ? "Executing Sequence..." : "Initiate Protocol"}
           </Button>
        </div>

        {/* Status Log */}
        {responses.length > 0 && (
           <div className="pt-4 border-t border-dashed border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
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
        )}
      </CardContent>
    </Card>
  )
}

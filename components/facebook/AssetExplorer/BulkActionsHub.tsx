"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Loader2, Command } from "lucide-react"
import { FacebookBusiness, SystemUser } from "@/types/facebook"
import { useBulkActions } from "@/hooks/useBulkActions"
import { ProtocolSelector } from "./components/BulkActions/ProtocolSelector"
import { TargetContext } from "./components/BulkActions/TargetContext"
import { AuthorityLevel } from "./components/BulkActions/AuthorityLevel"
import { ExecutionLogs } from "./components/BulkActions/ExecutionLogs"

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
  const {
    action, setAction,
    targetBmId, setTargetBmId,
    targetSystemUserId, setTargetSystemUserId,
    taskMode, setTaskMode,
    processing,
    responses,
    executeAction,
    handleCopyLogs
  } = useBulkActions(selectedPageIds, activeToken, activeViewerId, businesses, systemUsers, onSuccess)

  return (
    <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl sticky top-6">
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold">Action Control Hub</CardTitle>
            <p className="text-xs text-black tracking-tight font-extrabold">
              Targets: {selectedPageIds.length} Assets
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        <div className="space-y-4">
           <ProtocolSelector action={action} setAction={setAction} />

           <div className="space-y-3 p-4 bg-muted/30 border border-border/40 rounded-xl">
              <TargetContext 
                action={action}
                targetBmId={targetBmId}
                setTargetBmId={setTargetBmId}
                businesses={businesses}
                targetSystemUserId={targetSystemUserId}
                setTargetSystemUserId={setTargetSystemUserId}
                systemUsers={systemUsers}
              />

              <AuthorityLevel 
                action={action}
                taskMode={taskMode}
                setTaskMode={setTaskMode}
              />
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

        <ExecutionLogs 
          responses={responses}
          handleCopyLogs={handleCopyLogs}
        />
      </CardContent>
    </Card>
  )
}

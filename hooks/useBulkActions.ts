"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { facebookService } from "@/services/facebook.service"
import { FacebookBusiness, SystemUser } from "@/types/facebook"

export type ActionType = 
  | "share-other-bm" 
  | "add-current-bm" 
  | "assign-user-current-bm" 
  | "remove-user-current-bm" 
  | "remove-page-current-bm"

export type ResponseItem = {
  id: string
  status: "success" | "failed"
  message: string
}

export function useBulkActions(
  selectedPageIds: string[], 
  activeToken: string, 
  activeViewerId: string,
  businesses: FacebookBusiness[], 
  systemUsers: SystemUser[],
  onSuccess: () => void
) {
  const [action, setAction] = useState<ActionType>("assign-user-current-bm")
  const [targetBmId, setTargetBmId] = useState("")
  const [targetSystemUserId, setTargetSystemUserId] = useState("")
  const [taskMode, setTaskMode] = useState<"basic" | "full">("basic")
  const [processing, setProcessing] = useState(false)
  const [responses, setResponses] = useState<ResponseItem[]>([])

  useEffect(() => {
    if (!targetBmId && businesses.length > 0) setTargetBmId(businesses[0].id)
  }, [businesses, targetBmId])

  useEffect(() => {
    if (activeViewerId) setTargetSystemUserId(activeViewerId)
    else if (!targetSystemUserId && systemUsers.length > 0) setTargetSystemUserId(systemUsers[0].id)
  }, [systemUsers, targetSystemUserId, activeViewerId])

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
          if (targetBmId) {
            result = await facebookService.removeSystemUserFromPagesBatch(selectedPageIds, targetBmId, targetSystemUserId, activeToken)
          } else {
            result = await facebookService.removeSystemUserFromPagesByPageAssignedUsersBatch(selectedPageIds, targetSystemUserId, activeToken)
          }
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
    } catch {
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

  return {
    action, setAction,
    targetBmId, setTargetBmId,
    targetSystemUserId, setTargetSystemUserId,
    taskMode, setTaskMode,
    processing,
    responses,
    executeAction,
    handleCopyLogs
  }
}

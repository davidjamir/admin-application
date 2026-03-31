"use client"

import React, { useState, useMemo, useEffect } from "react"
import { Users2, Loader2, Search, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { BusinessRow } from "@/types/facebook"

interface AssignAppUserDialogProps {
  business: BusinessRow
  appId: string
  appName: string
  adminToken: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  existingUserIds?: string[]
}

const APP_ROLES = [
  {
    id: "ADMIN",
    label: "Admin",
    tasks: ["MANAGE"],
    description: "Full control over the application, including role management and settings.",
    tags: ["Manage", "Analyze"]
  },
  {
    id: "DEVELOPER",
    label: "Developer",
    tasks: ["MANAGE"],
    description: "Can manage technical aspects and application configuration.",
    tags: ["Develop", "Manage"]
  },
  {
    id: "ADVERTISER",
    label: "Advertiser",
    tasks: ["ADVERTISE"],
    description: "Can create and manage ads related to this application.",
    tags: ["Advertise", "Analyze"]
  },
  {
    id: "ANALYST",
    label: "Analyst",
    tasks: ["ANALYZE"],
    description: "Can view application insights and performance data.",
    tags: ["Analyze"]
  }
]

export function AssignAppUserDialog({
  business,
  appId,
  appName,
  adminToken,
  isOpen,
  onClose,
  onSuccess,
  existingUserIds = []
}: AssignAppUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>("ADMIN")
  const [searchQuery, setSearchQuery] = useState("")

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedUserIds([])
      setSelectedRoleId("ADMIN")
      setSearchQuery("")
    }
  }, [isOpen])

  // Unify user sources (Business Users and FB System Users)
  const unifiedUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; type: string }>()

    business.business_users?.data?.forEach((u: { id: string; name: string; email: string; role: string }) => {
      map.set(u.id, { id: u.id, name: u.name, email: u.email || "", type: "Business User" })
    })

    business.system_users?.forEach((u: { id: string; name: string; role: string }) => {
      map.set(u.id, { id: u.id, name: u.name, email: "", type: "System User" })
    })

    return Array.from(map.values()).filter(u => !existingUserIds.includes(u.id))
  }, [business.system_users, business.business_users?.data, existingUserIds])

  const filteredUsers = unifiedUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  )

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleAssign = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user")
      return
    }

    const role = APP_ROLES.find(r => r.id === selectedRoleId)
    if (!role) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/apps/${appId}/users?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUserIds,
          tasks: role.tasks
        })
      })

      const data = await res.json()
      if (data.success) {
        toast.success(`Assigned ${selectedUserIds.length} user(s) to ${appName}`)
        onSuccess?.()
        onClose()
      } else {
        throw new Error(data.error || "Failed to assign users")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error assigning users")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 pb-4 bg-muted/5 border-b border-border/40">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users2 className="w-5 h-5 text-primary" strokeWidth={2.5} />
            </div>
            <Badge variant="outline" className="text-[10px] font-bold tracking-tight bg-primary/5 text-primary border-primary/20">FB APPLICATION</Badge>
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">Assign App Permissions</DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1">
            Grant people specific access levels for <span className="text-foreground font-medium">{appName}</span>.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 h-[450px]">
          {/* Left: User Selection */}
          <div className="flex flex-col border-r border-border/40 bg-card">
            <div className="p-4 border-b border-border/40">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                1. Select Users
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
                <input
                  type="text"
                  placeholder="Find teammate or ID..."
                  className="h-9 pl-8 pr-3 text-xs bg-muted/30 border border-border/40 rounded-lg outline-none focus:ring-1 focus:ring-primary/20 w-full transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id)
                  return (
                    <div
                      key={user.id}
                      className={cn(
                        "flex items-center justify-between p-3 px-4 hover:bg-muted/40 transition-colors cursor-pointer group select-none",
                        isSelected && "bg-primary/[0.03]"
                      )}
                      onClick={() => toggleUser(user.id)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 group-hover:scale-110 transition-transform">{user.name.charAt(0)}</div>
                        <div className="flex flex-col overflow-hidden min-w-0">
                          <span className="text-xs font-bold truncate group-hover:text-primary transition-colors">{user.name}</span>
                          <span className="text-[9px] text-muted-foreground/60 font-mono truncate tracking-tight">{user.id}</span>
                        </div>
                      </div>
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-all duration-200",
                        isSelected ? "bg-primary border-primary" : "border-border/60"
                      )}>
                        {isSelected && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={4} />}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-40 grayscale">
                   <div className="w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center mb-2"><Search className="w-5 h-5" /></div>
                   <p className="text-[11px] font-medium italic">No users found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Role Selection */}
          <div className="flex flex-col bg-muted/[0.02]">
            <div className="p-5 border-b border-border/40">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4 block">
                2. Assign Access Role
              </Label>
              <div className="space-y-2">
                {APP_ROLES.map((role) => {
                  const isSelected = selectedRoleId === role.id
                  return (
                    <div
                      key={role.id}
                      className={cn(
                        "p-3 px-4 rounded-xl border transition-all cursor-pointer select-none flex items-center gap-3.5",
                        isSelected
                          ? "border-primary bg-primary/[0.03] shadow-sm"
                          : "border-border/40 hover:border-primary/30 hover:bg-muted/10"
                      )}
                      onClick={() => setSelectedRoleId(role.id)}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                        isSelected ? "border-primary" : "border-muted-foreground/30"
                      )}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className={cn("text-[11px] font-extrabold uppercase tracking-tight", isSelected ? "text-primary" : "text-foreground")}>{role.label}</p>
                        <p className="text-[9px] text-muted-foreground leading-tight">{role.description}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-5 flex-1 bg-muted/[0.01]">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 block">Permissions Included</Label>
              <div className="flex flex-wrap gap-1.5">
                {APP_ROLES.find(r => r.id === selectedRoleId)?.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[8px] font-black tracking-tight bg-primary/5 text-primary/80 border border-primary/10 rounded-full px-2">
                    {tag.toUpperCase()}
                  </Badge>
                ))}
              </div>

              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-2">
                <p className="text-[10px] text-primary/70 leading-relaxed font-medium">
                   Assignment will grant these users direct permissions on the Facebook Graph API for this application.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 bg-muted/5 border-t border-border/40">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting} className="text-xs h-9">Cancel</Button>
          <Button
            disabled={isSubmitting || selectedUserIds.length === 0}
            onClick={handleAssign}
            className="text-xs h-9 font-bold bg-primary hover:bg-primary/90 text-white min-w-[140px]"
          >
            {isSubmitting ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Assigning...</> : `Assign ${selectedUserIds.length} User${selectedUserIds.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

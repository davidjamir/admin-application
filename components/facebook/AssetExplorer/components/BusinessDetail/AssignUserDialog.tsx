"use client"

import React, { useState, useMemo } from "react"
import { 
  Users2, 
  Loader2, 
  Search, 
  Check 
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { BusinessRow, SystemUser } from "@/types/facebook"

interface AssignUserDialogProps {
  business: BusinessRow
  pageId: string
  pageName: string
  adminToken: string
  systemUsers?: SystemUser[]
  allBusinessUsers?: { id: string; name: string; email?: string; role?: string }[]
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const PAGE_ROLES = [
  { 
    id: "ADMIN", 
    label: "Admin", 
    tasks: ["MANAGE", "CREATE_CONTENT", "MODERATE", "ADVERTISE", "ANALYZE"], 
    description: "Can manage admin roles, send messages, post as the Page, create ads, and view reports.",
    tags: ["Manage", "Create Content", "Moderate", "Advertise", "Analyze"]
  },
  { 
    id: "EDITOR", 
    label: "Editor", 
    tasks: ["CREATE_CONTENT", "MODERATE", "ADVERTISE", "ANALYZE"], 
    description: "Can edit the Page, send messages, post as the Page, create ads, and view reports.",
    tags: ["Create Content", "Moderate", "Advertise", "Analyze"]
  },
  { 
    id: "MODERATOR", 
    label: "Moderator", 
    tasks: ["MODERATE", "ADVERTISE", "ANALYZE"], 
    description: "Can respond to and delete comments, send messages as the Page, create ads, and view reports.",
    tags: ["Moderate", "Advertise", "Analyze"]
  },
  { 
    id: "ADVERTISER", 
    label: "Advertiser", 
    tasks: ["ADVERTISE", "ANALYZE"], 
    description: "Can create ads for the Page and view insights.",
    tags: ["Advertise", "Analyze"]
  },
  { 
    id: "ANALYST", 
    label: "Analyst", 
    tasks: ["ANALYZE"], 
    description: "Can only view reports and insights.",
    tags: ["Analyze"]
  }
]

export function AssignUserDialog({ 
  business, 
  pageId, 
  pageName, 
  adminToken, 
  allBusinessUsers = [],
  trigger,
  onSuccess 
}: AssignUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState<string>("ADMIN")
  const [searchQuery, setSearchQuery] = useState("")

  // Unify all user sources (ONLY Business and FB System Users)
  const unifiedUsers = useMemo(() => {
    const map = new Map<string, { id: string; name: string; email: string; type: string }>()
    
    allBusinessUsers.forEach(u => {
      map.set(u.id, { id: u.id, name: u.name, email: u.email || "", type: "Business User" })
    })

    business.system_users?.forEach(u => {
      map.set(u.id, { id: u.id, name: u.name, email: "", type: "System User" })
    })

    return Array.from(map.values())
  }, [allBusinessUsers, business.system_users])

  const filteredUsers = unifiedUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.id.includes(searchQuery)
  )

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev: string[]) => 
      prev.includes(userId) ? prev.filter((id: string) => id !== userId) : [...prev, userId]
    )
  }

  const handleAssign = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please Select At Least One User")
      return
    }
    
    const role = PAGE_ROLES.find(r => r.id === selectedRoleId)
    if (!role) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/facebook/business/${business.id}/pages/${pageId}/users?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: selectedUserIds,
          tasks: role.tasks
        })
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed To Assign Users")

      toast.success(`Successfully Assigned Roles To ${selectedUserIds.length} User(s)`)
      setIsOpen(false)
      setSelectedUserIds([])
      setSelectedRoleId("ADMIN")
      onSuccess?.()
    } catch (error) {
      console.error("[AssignUser] Error:", error)
      toast.error(error instanceof Error ? error.message : "Internal Server Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Users2 className="w-4 h-4" />
            Assign Users
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl bg-card">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-3 text-lg font-semibold tracking-tight">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Users2 className="w-5 h-5 text-primary" />
            </div>
            Assign User Permissions
          </DialogTitle>
          <p className="text-[13px] text-muted-foreground mt-1 px-1">
            Grant People Specific Access Levels For <span className="text-foreground font-medium">{pageName}</span>.
          </p>
        </DialogHeader>

        <div className="p-5 space-y-5">
          {/* User Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-muted-foreground/70">
                1. Select Users ({selectedUserIds.length})
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40" />
                <input 
                  type="text" 
                  placeholder="Find teammate or ID..."
                  className="h-6 pl-6 pr-3 text-[9px] bg-muted/30 border border-border/40 rounded-md outline-none focus:ring-1 focus:ring-primary/20 w-44 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="border border-border/40 rounded-xl overflow-hidden bg-muted/5">
              <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                {filteredUsers.length > 0 ? (
                  <div className="divide-y divide-border/10">
                    {filteredUsers.map((user: { id: string; name: string; email: string; type: string }) => {
                      const isSelected = selectedUserIds.includes(user.id)
                      return (
                        <div 
                          key={user.id}
                          className={cn(
                            "flex items-center justify-between p-2.5 px-4 hover:bg-muted/40 transition-colors cursor-pointer group select-none",
                            isSelected && "bg-primary/[0.04]"
                          )}
                          onClick={() => toggleUser(user.id)}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className={cn(
                              "w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black transition-all shadow-sm",
                              isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                            )}>
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <div className="flex items-center gap-2">
                                <p className={cn(
                                  "text-[11px] font-bold truncate",
                                  isSelected ? "text-primary" : "text-foreground"
                                )}>{user.name}</p>
                                <span className="text-[7px] px-1.5 py-0.5 rounded-full border border-green-500/20 bg-green-500/5 text-green-600 font-bold leading-none">
                                  {user.type}
                                </span>
                              </div>
                              <p className="text-[9px] text-muted-foreground/50 font-mono">
                                ID: {user.id}
                              </p>
                            </div>
                          </div>
                          <div className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 transform",
                            isSelected 
                              ? "bg-primary border-primary scale-100 opacity-100 shadow-sm" 
                              : "border-border/60 group-hover:border-primary/40 scale-90 opacity-40 shadow-none"
                          )}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={4} />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-[10px] text-muted-foreground/60 italic">
                    No Teammates Found For This Search
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold text-muted-foreground/70">
              2. Assign Access Role
            </Label>
            <div className="space-y-1.5">
              {PAGE_ROLES.map((role) => {
                const isSelected = selectedRoleId === role.id
                return (
                  <div 
                    key={role.id}
                    className={cn(
                      "p-2.5 px-4 rounded-xl border transition-all cursor-pointer select-none flex items-center gap-3.5",
                      isSelected 
                        ? "border-primary bg-primary/[0.03] shadow-sm" 
                        : "border-border/40 hover:border-primary/30 hover:bg-muted/10"
                    )}
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    <div className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/20"
                    )}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <p className={cn(
                          "text-[11px] font-bold shrink-0",
                          isSelected ? "text-primary" : "text-foreground"
                        )}>{role.label}</p>
                        <div className="flex items-center justify-end flex-wrap gap-1">
                          {role.tags.map(tag => (
                            <span key={tag} className="text-[7px] font-bold border border-green-500/30 text-green-600 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[9px] text-muted-foreground leading-tight italic opacity-80">
                        {role.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="p-5 bg-muted/10 border-t border-border/40 flex items-center justify-end gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsOpen(false)}
            className="text-[10px] h-8 font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            disabled={isSubmitting || selectedUserIds.length === 0}
            onClick={handleAssign}
            className={cn(
              "bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] px-5 h-8 transition-all shadow-md active:scale-95",
              (isSubmitting || selectedUserIds.length === 0) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-2.5 h-2.5 animate-spin mr-1.5" />
                Assigning {selectedUserIds.length} Users...
              </>
            ) : (
              `Confirm Assignment (${selectedUserIds.length})`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

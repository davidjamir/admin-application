"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AddSystemUserDialogProps {
  businessId: string
  adminToken: string
  onSuccess?: () => void
  existingUsers?: Array<{ id: string; name: string; role: string }>
  verificationStatus?: string
}

export function AddSystemUserDialog({ 
  businessId, 
  adminToken, 
  onSuccess,
  existingUsers = [],
  verificationStatus = "not_verified"
}: AddSystemUserDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [role, setRole] = useState("")

  const isVerified = verificationStatus === "verified"
  const admins = existingUsers.filter(u => u.role === "ADMIN")
  const employees = existingUsers.filter(u => u.role !== "ADMIN")

  const canAddAdmin = admins.length < 1
  const employeeLimit = isVerified ? 10 : 1
  const canAddEmployee = employees.length < employeeLimit

  const totalLimitReached = !canAddAdmin && !canAddEmployee

  // Initialize role and name based on availability
  React.useEffect(() => {
    if (isOpen) {
      const initialRole = canAddAdmin ? "ADMIN" : "EMPLOYEE"
      setRole(initialRole)
      setName(initialRole === "ADMIN" ? "AD - " : "EM - ")
    }
  }, [isOpen, canAddAdmin])

  const handleRoleChange = (newRole: string) => {
    setRole(newRole)
    const prefix = newRole === "ADMIN" ? "AD - " : "EM - "
    
    if (!name.trim() || name === "AD - " || name === "EM - ") {
      setName(prefix)
    } else {
      if (name.startsWith("AD - ")) {
        setName(prefix + name.slice(5))
      } else if (name.startsWith("EM - ")) {
        setName(prefix + name.slice(5))
      } else {
        setName(prefix + name)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Facebook expects 'ADMIN' or 'USER' for role parameter
    const fbRole = role === "ADMIN" ? "ADMIN" : "USER"
    const prefix = role === "ADMIN" ? "AD - " : "EM - "
    const actualName = name.startsWith(prefix) ? name.slice(prefix.length).trim() : name.trim()

    if (!actualName) {
      toast.error("Please enter a name for the system user")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/facebook/business/${businessId}/system-users?token=${encodeURIComponent(adminToken)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Use standard FB role names
        body: JSON.stringify({ name, role: fbRole }),
      })

      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create system user")

      toast.success(`System user "${name}" created successfully`)
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error("[Create System User] error:", error)
      toast.error(error instanceof Error ? error.message : "Internal Server Error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <div className="w-fit">
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  disabled={totalLimitReached}
                  className={cn(
                    "h-7 text-[10px] gap-1 px-2 hover:bg-primary/5 hover:text-primary cursor-pointer transition-opacity",
                    totalLimitReached && "opacity-40 grayscale cursor-not-allowed"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  Add User
                </Button>
              </DialogTrigger>
            </div>
          </TooltipTrigger>
          
          <TooltipContent side="top" className="text-[10px] p-2 bg-popover text-popover-foreground border shadow-lg max-w-[200px] text-center">
            {totalLimitReached ? 
              `Limit Reached: ${isVerified ? "1 Admin / 10 Employees max for verified BM" : "1 Admin / 1 Employee max for unverified BM"}` : 
              "Add new system user"}
          </TooltipContent>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base font-normal">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Add System User
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="name" className="text-xs">Display Name</Label>
                  <span className="text-[10px] text-muted-foreground/60 italic">
                    {isVerified ? "1 AD / 10 EM" : "1 AD / 1 EM"}
                  </span>
                </div>
                <Input
                  id="name"
                  placeholder="Enter name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9 text-sm focus-visible:ring-primary/20"
                  autoFocus
                  disabled={isSubmitting}
                />
                <p className="text-[10px] text-muted-foreground/60 px-1 italic">
                  Use the prefix {role === "ADMIN" ? "AD - " : "EM - "} for consistency.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs">System User Role</Label>
                <Select 
                  value={role} 
                  onValueChange={handleRoleChange}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="h-9 text-sm focus:ring-primary/20">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN" disabled={!canAddAdmin}>
                      Admin {!canAddAdmin && "(Limit Reached: 1)"}
                    </SelectItem>
                    <SelectItem value="EMPLOYEE" disabled={!canAddEmployee}>
                      Employee {!canAddEmployee && `(Limit Reached: ${employeeLimit})`}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <DialogFooter className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all cursor-pointer font-medium h-10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Create System User
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Tooltip>
    </TooltipProvider>
  )
}

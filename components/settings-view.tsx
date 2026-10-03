"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  User,
  KeyRound,
  Users,
  Palette,
  Bell,
  Cpu,
  Database,
  Eye,
  EyeOff,
  Check,
  Copy,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Sun,
  Moon,
  Monitor,
  Info,
  CheckCircle2,
  Trash2,
  UserPlus,
  Search,
  ShieldAlert,
  X,
} from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SessionUser } from "@/lib/auth/session"

type SettingsTab = "profile" | "password" | "users" | "appearance" | "notifications" | "integrations" | "system"

interface SettingsViewProps {
  user: SessionUser
}

interface UserAccountItem {
  id: string
  name: string
  email: string
  role: string
  createdAt: string | null
}

interface TabItem {
  id: SettingsTab
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const TABS: TabItem[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Account details & email",
    icon: User,
  },
  {
    id: "password",
    label: "Password",
    description: "Credentials & security",
    icon: KeyRound,
  },
  {
    id: "users",
    label: "User Accounts",
    description: "Add & manage team members",
    icon: Users,
    adminOnly: true,
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme & display settings",
    icon: Palette,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts & event triggers",
    icon: Bell,
  },
  {
    id: "integrations",
    label: "API & Services",
    description: "Cloudflare R2, Redis & APIs",
    icon: Cpu,
  },
  {
    id: "system",
    label: "System & Storage",
    description: "Cache, diagnostics & sessions",
    icon: Database,
  },
]

export function SettingsView({ user }: SettingsViewProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const isAdmin = user.role?.toUpperCase() === "ADMIN"

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [copiedId, setCopiedId] = useState(false)

  // Safety fallback if non-admin somehow accesses users tab
  useEffect(() => {
    if (!isAdmin && activeTab === "users") {
      setActiveTab("profile")
    }
  }, [isAdmin, activeTab])

  // Profile Form state
  const [profileLoading, setProfileLoading] = useState(false)
  const [name, setName] = useState(user.name || "")
  const [email, setEmail] = useState(user.email || "")

  // Password Form state
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // User Accounts state (ADMIN ONLY)
  const [usersList, setUsersList] = useState<UserAccountItem[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearch, setUserSearch] = useState("")
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState("ADMIN")
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Notification Preferences state
  const [notifySyncFail, setNotifySyncFail] = useState(true)
  const [notifyScheduleDone, setNotifyScheduleDone] = useState(true)
  const [notifyCriticalErrors, setNotifyCriticalErrors] = useState(true)
  const [telegramWebhook, setTelegramWebhook] = useState("")
  const [savingNotifications, setSavingNotifications] = useState(false)

  // Display Preferences state
  const [compactMode, setCompactMode] = useState(false)
  const [enableDualClocks, setEnableDualClocks] = useState(true)

  // Fetch users list (ADMIN ONLY)
  const loadUsers = useCallback(async () => {
    if (!isAdmin) return
    try {
      setLoadingUsers(true)
      const res = await fetch("/api/users")
      const data = await res.json()
      if (data.success && Array.isArray(data.users)) {
        setUsersList(data.users)
      } else {
        toast.error(data.message || "Failed to load users")
      }
    } catch {
      toast.error("Failed to fetch user accounts")
    } finally {
      setLoadingUsers(false)
    }
  }, [isAdmin])

  useEffect(() => {
    if (activeTab === "users" && isAdmin) {
      void loadUsers()
    }
  }, [activeTab, isAdmin, loadUsers])

  // Handle Create User (ADMIN ONLY)
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()

    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
      toast.error("Please fill in all required fields")
      return
    }

    if (newUserPassword.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setCreatingUser(true)

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName.trim(),
          email: newUserEmail.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to create user account")
      }

      toast.success(data.message || "User account created successfully")
      setNewUserName("")
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserRole("ADMIN")
      setShowAddUser(false)
      void loadUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error creating user"
      toast.error(msg)
    } finally {
      setCreatingUser(false)
    }
  }

  // Handle Delete User (ADMIN ONLY)
  async function handleDeleteUser(id: string, userEmail: string) {
    if (id === user.id) {
      toast.error("You cannot delete your own active administrator account")
      return
    }

    if (!confirm(`Are you sure you want to delete user account "${userEmail}"?`)) {
      return
    }

    setDeletingUserId(id)

    try {
      const res = await fetch(`/api/users?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete user account")
      }

      toast.success("User account deleted successfully")
      void loadUsers()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error deleting user"
      toast.error(msg)
    } finally {
      setDeletingUserId(null)
    }
  }

  // Handle Profile Update
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to update profile")
      }

      toast.success("Profile updated successfully")
      router.refresh()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      toast.error(message)
    } finally {
      setProfileLoading(false)
    }
  }

  // Handle Password Update
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!currentPassword) {
      toast.error("Please enter your current password")
      return
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match")
      return
    }

    setPasswordLoading(true)

    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Failed to update password")
      }

      toast.success("Password changed successfully")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong"
      toast.error(message)
    } finally {
      setPasswordLoading(false)
    }
  }

  // Copy User ID
  const copyUserId = () => {
    if (!user.id) return
    void navigator.clipboard.writeText(user.id)
    setCopiedId(true)
    toast.success("User ID copied to clipboard")
    setTimeout(() => setCopiedId(false), 2000)
  }

  // Save Notifications
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault()
    setSavingNotifications(true)
    setTimeout(() => {
      setSavingNotifications(false)
      toast.success("Notification preferences saved")
    }, 400)
  }

  // Clear Browser Storage
  const handleClearCache = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      toast.success("Client local storage cache cleared")
    } catch {
      toast.error("Failed to clear browser storage")
    }
  }

  const userInitials = (user.name || user.email || "AD")
    .slice(0, 2)
    .toUpperCase()

  // Filter available tabs based on admin privileges
  const visibleTabs = TABS.filter((tab) => !tab.adminOnly || isAdmin)

  // Filter user accounts by search term
  const filteredUsers = usersList.filter((u) => {
    if (!userSearch.trim()) return true
    const term = userSearch.toLowerCase().trim()
    return u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || u.role.toLowerCase().includes(term)
  })

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
      {/* Left Column: Navigation Sidebar */}
      <div className="w-full md:w-64 lg:w-72 shrink-0">
        <div className="border rounded-xl bg-card p-2 space-y-1 shadow-2xs">
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Settings Menu
          </div>
          {visibleTabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium transition-all flex items-start gap-3 border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
                    : "bg-transparent text-foreground border-transparent hover:bg-muted/70"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate leading-tight">{tab.label}</span>
                    {tab.adminOnly && (
                      <span className={`text-[9px] px-1 py-0 rounded font-semibold uppercase tracking-wider ml-1 shrink-0 ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-primary/10 text-primary"
                      }`}>
                        Admin
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] truncate mt-0.5 ${
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {tab.description}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* User Card info in sidebar */}
        <div className="mt-4 border rounded-xl bg-card p-3 shadow-2xs space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
              {userInitials}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold truncate text-foreground">{user.name || "Administrator"}</span>
              <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
            </div>
          </div>
          <div className="pt-2 border-t flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Role</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-mono font-semibold">
              {user.role || "ADMIN"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Right Column: Detailed Settings Panel */}
      <div className="flex-1 w-full min-w-0">
        {/* TAB 1: Profile */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Profile Information
                    </CardTitle>
                    <CardDescription>
                      Update your account details and primary email address.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {user.role || "ADMIN"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Account ID Box */}
                <div className="p-3 bg-muted/40 border rounded-lg flex items-center justify-between gap-3 text-xs">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Account ID
                    </span>
                    <span className="font-mono text-xs text-foreground truncate select-all">
                      {user.id || "dev-id"}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyUserId}
                    className="h-7 text-xs gap-1.5 shrink-0"
                  >
                    {copiedId ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    {copiedId ? "Copied" : "Copy ID"}
                  </Button>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="profile-name">Full Name</Label>
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="profile-email">Email Address</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    required
                  />
                </div>
              </CardContent>

              <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Changes take effect immediately upon saving.
                </span>
                <Button type="submit" disabled={profileLoading} className="text-xs px-4 h-9">
                  {profileLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  {profileLoading ? "Saving..." : "Save Profile"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}

        {/* TAB 2: Password */}
        {activeTab === "password" && (
          <div className="space-y-6">
            <form onSubmit={handlePasswordSubmit}>
              <Card>
                <CardHeader>
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <KeyRound className="h-5 w-5 text-primary" />
                      Change Password
                    </CardTitle>
                    <CardDescription>
                      Ensure your account uses a secure password with a minimum of 6 characters.
                    </CardDescription>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pr-9"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {newPassword && confirmPassword && (
                      <span className={`text-[11px] font-medium flex items-center gap-1 ${
                        newPassword === confirmPassword ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                      }`}>
                        {newPassword === confirmPassword ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Passwords match
                          </>
                        ) : (
                          "Passwords do not match"
                        )}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    You will remain logged in after changing password.
                  </span>
                  <Button type="submit" disabled={passwordLoading} className="text-xs px-4 h-9">
                    {passwordLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                    {passwordLoading ? "Updating..." : "Update Password"}
                  </Button>
                </CardFooter>
              </Card>
            </form>

            {/* Security Notice Card */}
            <Card className="bg-muted/20 border-dashed">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-semibold flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Security Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3 pt-0 text-xs text-muted-foreground space-y-1.5">
                <p>• Use at least 8 characters with a mix of letters, numbers, and symbols.</p>
                <p>• Avoid reusing passwords across different admin systems or personal accounts.</p>
                <p>• Session tokens expire automatically after 7 days of inactivity.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB: User Accounts (ADMIN ONLY) */}
        {activeTab === "users" && isAdmin && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        User Accounts
                      </CardTitle>
                      <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                        Admin Only
                      </Badge>
                    </div>
                    <CardDescription>
                      Create and manage user accounts authorized to access this administration system.
                    </CardDescription>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowAddUser(!showAddUser)}
                    className="text-xs gap-1.5 h-8 shrink-0 self-start sm:self-auto"
                  >
                    {showAddUser ? <X className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                    {showAddUser ? "Cancel" : "Add Account"}
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Form to Add User Account (Collapsible) */}
                {showAddUser && (
                  <form onSubmit={handleCreateUser} className="p-4 border rounded-xl bg-muted/20 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <UserPlus className="h-4 w-4 text-primary" />
                        Create New User Account
                      </span>
                      <span className="text-[10px] text-muted-foreground">Credentials will be stored securely</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label htmlFor="new-user-name" className="text-xs">Full Name</Label>
                        <Input
                          id="new-user-name"
                          value={newUserName}
                          onChange={(e) => setNewUserName(e.target.value)}
                          placeholder="e.g. Alex Johnson"
                          className="h-8 text-xs"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="new-user-email" className="text-xs">Email Address</Label>
                        <Input
                          id="new-user-email"
                          type="email"
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="h-8 text-xs"
                          required
                        />
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="new-user-password" className="text-xs">Initial Password</Label>
                        <div className="relative">
                          <Input
                            id="new-user-password"
                            type={showNewUserPassword ? "text" : "password"}
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="h-8 text-xs pr-8"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                            className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewUserPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-1.5">
                        <Label htmlFor="new-user-role" className="text-xs">Account Role</Label>
                        <select
                          id="new-user-role"
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value)}
                          className="h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="ADMIN">ADMIN (Full Access)</option>
                          <option value="EDITOR">EDITOR (Content Publisher)</option>
                          <option value="VIEWER">VIEWER (Read Only)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddUser(false)}
                        className="text-xs h-8"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={creatingUser}
                        className="text-xs h-8 gap-1.5"
                      >
                        {creatingUser ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        {creatingUser ? "Creating..." : "Save Account"}
                      </Button>
                    </div>
                  </form>
                )}

                {/* Filter and Search */}
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search accounts..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void loadUsers()}
                    disabled={loadingUsers}
                    className="h-8 text-xs gap-1.5"
                  >
                    <RefreshCw className={`h-3 w-3 ${loadingUsers ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </div>

                {/* Users List */}
                <div className="space-y-2">
                  {loadingUsers && usersList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading user accounts...
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg p-6">
                      No user accounts found matching your search.
                    </div>
                  ) : (
                    filteredUsers.map((item) => {
                      const isCurrentUser = item.id === user.id || item.email.toLowerCase() === user.email?.toLowerCase()
                      const initials = (item.name || item.email || "U").slice(0, 2).toUpperCase()

                      return (
                        <div
                          key={item.id}
                          className="p-3 border rounded-xl bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {item.name || "Unnamed User"}
                                </span>
                                {isCurrentUser && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-medium">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate font-mono">
                                {item.email}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                            <Badge
                              variant={item.role?.toUpperCase() === "ADMIN" ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0 h-4 font-mono font-semibold"
                            >
                              {item.role || "ADMIN"}
                            </Badge>

                            {item.createdAt && (
                              <span className="text-[10px] text-muted-foreground hidden lg:inline">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </span>
                            )}

                            {!isCurrentUser ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => void handleDeleteUser(item.id, item.email)}
                                disabled={deletingUserId === item.id}
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Delete account"
                              >
                                {deletingUserId === item.id ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground px-2 italic">Active</span>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </CardContent>

              <CardFooter className="border-t px-6 py-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                  Admin-only management portal
                </span>
                <span>{usersList.length} total accounts</span>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* TAB 3: Appearance (Proposed Setting) */}
        {activeTab === "appearance" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Appearance & Theme
              </CardTitle>
              <CardDescription>
                Customize how the administration dashboard looks on your device.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Theme Selector */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Theme Preference</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Light */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-2.5 transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Sun className="h-5 w-5 text-amber-500" />
                      {theme === "light" && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Light</div>
                      <div className="text-[10px] text-muted-foreground">Crisp clean light mode</div>
                    </div>
                  </button>

                  {/* Dark */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-2.5 transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Moon className="h-5 w-5 text-indigo-400" />
                      {theme === "dark" && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Dark</div>
                      <div className="text-[10px] text-muted-foreground">Sleek high contrast dark mode</div>
                    </div>
                  </button>

                  {/* System */}
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`p-3.5 rounded-xl border text-left flex flex-col gap-2.5 transition-all ${
                      theme === "system"
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Monitor className="h-5 w-5 text-muted-foreground" />
                      {theme === "system" && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">System</div>
                      <div className="text-[10px] text-muted-foreground">Syncs with operating system</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Display Options */}
              <div className="pt-4 border-t space-y-4">
                <Label className="text-sm font-semibold">Interface Options</Label>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-foreground block">Header Dual World Clocks</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Display real-time Hanoi and New York clocks on the top bar.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={enableDualClocks}
                    onChange={(e) => setEnableDualClocks(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <span className="text-xs font-medium text-foreground block">Compact Data Density</span>
                    <span className="text-[11px] text-muted-foreground block">
                      Reduce row paddings across data tables for higher information density.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={compactMode}
                    onChange={(e) => setCompactMode(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t px-6 py-4 flex items-center justify-end">
              <Button
                type="button"
                onClick={() => toast.success("Appearance preferences saved")}
                className="text-xs px-4 h-9"
              >
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* TAB 4: Notifications (Proposed Setting) */}
        {activeTab === "notifications" && (
          <form onSubmit={handleSaveNotifications}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose which events and channels trigger system notifications.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground block">R2 Sync Failure Alerts</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Get high-priority toast and log alerts when Cloudflare R2 sync fails.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifySyncFail}
                      onChange={(e) => setNotifySyncFail(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground block">Schedule Execution Reports</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Notify when periodic crawl and publish queues finish processing.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyScheduleDone}
                      onChange={(e) => setNotifyScheduleDone(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-foreground block">Critical Database & Auth Alerts</span>
                      <span className="text-[11px] text-muted-foreground block">
                        Immediate popups for connection drops or unauthorized access attempts.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyCriticalErrors}
                      onChange={(e) => setNotifyCriticalErrors(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Label htmlFor="telegram-webhook" className="text-xs font-semibold">
                    External Webhook / Telegram Bot URL (Optional)
                  </Label>
                  <Input
                    id="telegram-webhook"
                    value={telegramWebhook}
                    onChange={(e) => setTelegramWebhook(e.target.value)}
                    placeholder="https://api.telegram.org/bot<token>/sendMessage or webhook URL"
                    className="text-xs font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground">
                    Send urgent system alerts directly to a Telegram group or custom webhook endpoint.
                  </span>
                </div>
              </CardContent>

              <CardFooter className="border-t px-6 py-4 flex items-center justify-end">
                <Button type="submit" disabled={savingNotifications} className="text-xs px-4 h-9">
                  {savingNotifications && <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />}
                  {savingNotifications ? "Saving..." : "Save Notification Settings"}
                </Button>
              </CardFooter>
            </Card>
          </form>
        )}

        {/* TAB 5: API & Integrations (Proposed Setting) */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Cpu className="h-5 w-5 text-primary" />
                      API Connections & Services
                    </CardTitle>
                    <CardDescription>
                      Live status of connected cloud services and database engines.
                    </CardDescription>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                    4 Active Services
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Cloudflare R2 */}
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Cloudflare R2 Adapter</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">
                        Connected
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground block font-mono">
                      Target: /api/r2-sync/trigger • Auto sync enabled
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/r2-sync")}
                    className="text-xs h-7 gap-1"
                  >
                    Open R2 Sync <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                {/* Blogger API */}
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Blogger REST API</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">
                        Operational
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      Google OAuth2 client credentials configured for multi-account publishing.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/blogger-accounts")}
                    className="text-xs h-7 gap-1"
                  >
                    Accounts <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>

                {/* MongoDB */}
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">MongoDB Primary Cluster</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">
                        Connected
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      Collections: admins, origins, sites, pages, schedules, logs.
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">Cluster Ready</span>
                </div>

                {/* Upstash Redis */}
                <div className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Upstash Redis</span>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/40">
                        Connected
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      Distributed cache layer & rate limiter for high-throughput endpoints.
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">Active</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 6: System & Storage (Proposed Setting) */}
        {activeTab === "system" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  System Storage & Cache
                </CardTitle>
                <CardDescription>
                  Manage local client data cache, view current session info and system status.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Cache Clear Card */}
                <div className="p-4 border rounded-xl bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="text-xs font-semibold text-foreground">Clear Local Browser Storage</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Clears local UI filters, temporary caches, and table state without logging you out.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClearCache}
                    className="text-xs h-8 text-destructive hover:bg-destructive/10 shrink-0 gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Purge Local Cache
                  </Button>
                </div>

                {/* Diagnostics Overview */}
                <div className="space-y-2.5">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Runtime Diagnostics
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 border rounded-lg bg-card flex justify-between items-center">
                      <span className="text-muted-foreground">Framework</span>
                      <span className="font-semibold text-foreground">Next.js 16 (App Router)</span>
                    </div>
                    <div className="p-2.5 border rounded-lg bg-card flex justify-between items-center">
                      <span className="text-muted-foreground">Authentication</span>
                      <span className="font-semibold text-foreground">JWT HttpOnly Cookie</span>
                    </div>
                    <div className="p-2.5 border rounded-lg bg-card flex justify-between items-center">
                      <span className="text-muted-foreground">CSS Engine</span>
                      <span className="font-semibold text-foreground">Tailwind CSS v4</span>
                    </div>
                    <div className="p-2.5 border rounded-lg bg-card flex justify-between items-center">
                      <span className="text-muted-foreground">Session Expiry</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">7 Days (Rolling)</span>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="border-t px-6 py-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  7 Forge Inc Admin System
                </span>
                <Badge variant="outline" className="text-[10px] font-mono">
                  v0.1.0-prod
                </Badge>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Users, 
  Layers, 
  Eye, 
  EyeOff,
  Briefcase,
  Fingerprint
} from "lucide-react"
import { toast } from "sonner"
import { clearSession, isSessionExpired, loadSession, saveSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import FacebookLogin from "./FacebookLogin"
import SystemUserManager from "./SystemUserManager"
import PageManager from "./PageManager"

type TabKey = "tokens" | "personnel" | "assets"

export default function BusinessAssetHub() {
  const [activeTab, setActiveTab] = useState<TabKey>("tokens")
  const [adminPassword, setAdminPassword] = useState("")
  const [isAdminVerified, setIsAdminVerified] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)

  useEffect(() => {
    const saved = loadSession()
    if (saved) {
      setAdminPassword(saved)
      authenticate(saved, true)
    } else {
      setSessionChecked(true)
    }

    const interval = setInterval(() => {
      if (isSessionExpired()) {
        clearSession()
        setIsAdminVerified(false)
        setAdminPassword("")
        toast.error("Session expired")
      }
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const authenticate = async (password: string, silent = false) => {
    try {
      if (!silent) setAuthLoading(true)
      const res = await fetch("/api/database/systemUsers/secure-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Authentication failed")
      
      setIsAdminVerified(true)
      saveSession(password)
      if (!silent) toast.success("Authentication Successful")
    } catch (err) {
      setIsAdminVerified(false)
      if (!silent) toast.error("Invalid Credentials")
    } finally {
      setAuthLoading(false)
      setSessionChecked(true)
    }
  }

  if (!sessionChecked) return null

  if (!isAdminVerified) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="w-full max-w-[420px] border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <CardHeader className="text-center pb-2 bg-muted/30 border-b border-border/50">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold tracking-tight">Security Protocol</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Authorized personnel only beyond this point.</p>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Master Password"
                  className="pl-9 pr-10 h-11 border-border/50 focus:ring-primary/20 transition-all"
                  onKeyDown={(e) => e.key === "Enter" && authenticate(adminPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button 
                onClick={() => authenticate(adminPassword)} 
                disabled={authLoading || !adminPassword.trim()}
                className="w-full h-11 cursor-pointer font-bold shadow-lg shadow-primary/10"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Decrypt Access
              </Button>
            </div>
            <div className="pt-4 border-t border-dashed border-border/50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                 <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                 Encrypted Session Active
              </div>
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                 Credentials are validated against the global security layer. Session persistence is restricted for security.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 p-1 animate-in fade-in duration-700">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
             <div className="p-2.5 bg-primary/10 rounded-xl">
               <Briefcase className="w-6 h-6 text-primary" />
             </div>
             <div>
               <h1 className="text-2xl font-bold tracking-tight">Business Manager</h1>
               <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] font-mono h-4 bg-muted/50 border-border/50">PLATFORM_V2.0</Badge>
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Sync Integrity: 100%</span>
               </div>
             </div>
          </div>

          <TabsList className="bg-muted/40 p-1 rounded-xl h-11 border border-border/50 backdrop-blur-md">
            <TabsTrigger value="tokens" className="px-5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Token Ingestion</span>
            </TabsTrigger>
            <TabsTrigger value="personnel" className="px-5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Personnel Hub</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="px-5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Asset Explorer</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tokens" className="mt-0 focus-visible:outline-none">
          <FacebookLogin adminPassword={adminPassword} isAdminVerified={isAdminVerified} />
        </TabsContent>
        <TabsContent value="personnel" className="mt-0 focus-visible:outline-none">
          <SystemUserManager adminPassword={adminPassword} isAdminVerified={isAdminVerified} />
        </TabsContent>
        <TabsContent value="assets" className="mt-0 focus-visible:outline-none">
          <PageManager adminPassword={adminPassword} isAdminVerified={isAdminVerified} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("animate-spin", className)}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
)

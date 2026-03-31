'use client'

import { useState } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Key, Users, Layers, Briefcase } from "lucide-react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { useTokenIngestion } from "@/hooks/useTokenIngestion"

import TokenIngestion from "./TokenIngestion"
import SystemUserHub from "./SystemUserHub"
import PageManager from "./PageManager"

type TabKey = "tokens" | "personnel" | "assets"

export default function BusinessAssetHub() {
  const [activeTab, setActiveTab] = useState<TabKey>("tokens")
  const [isAdminVerified] = useState(true) // Always verified
  const [adminPassword] = useState("bypass") // Placeholder password

  const { loadingUsers } = useTokenIngestion(adminPassword, isAdminVerified)

  if (loadingUsers) {
    return <LoadingScreen />
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
                  <Badge variant="outline" className="text-[10px] font-mono h-4 bg-muted/50 border-border/50">Platform v3.0</Badge>
                  <div className="w-1 h-1 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-600 font-bold tracking-wider">Sync Integrity: 100%</span>
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
              <span className="hidden sm:inline">System User Hub</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="px-5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span className="hidden sm:inline">Asset Explorer</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tokens" className="mt-0 focus-visible:outline-none">
          <TokenIngestion adminPassword={adminPassword} isAdminVerified={isAdminVerified} />
        </TabsContent>
        <TabsContent value="personnel" className="mt-0 focus-visible:outline-none">
          <SystemUserHub adminPassword={adminPassword} isAdminVerified={isAdminVerified} />
        </TabsContent>
        <TabsContent value="assets" className="mt-0 focus-visible:outline-none">
          <PageManager adminPassword={adminPassword} isAdminVerified={isAdminVerified} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import React from "react"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Layers, User, Shield } from "lucide-react"
import { SystemUser } from "@/types/facebook"

interface AssetExplorerHeaderProps {
  mode: "system-user" | "account-user"
  setMode: (mode: "system-user" | "account-user") => void
  systemUsers: SystemUser[]
}

export function AssetExplorerHeader({ mode, setMode, systemUsers }: AssetExplorerHeaderProps) {
  return (
    <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-primary/10 rounded-xl">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl tracking-tight">Asset Management Explorer</CardTitle>
            <p className="text-[10px] font-medium text-muted-foreground tracking-widest">
              Loaded {systemUsers.length} system user(s).
            </p>
          </div>
        </div>

        <Tabs 
          value={mode} 
          onValueChange={(v: string) => setMode(v as "system-user" | "account-user")} 
          className="w-full md:w-auto"
        >
          <TabsList className="bg-background/50 border border-border/50 p-1 h-10">
            <TabsTrigger value="system-user" className="text-xs gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">System User</span>
            </TabsTrigger>
            <TabsTrigger value="account-user" className="text-xs gap-2 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Account User</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </CardHeader>
  )
}

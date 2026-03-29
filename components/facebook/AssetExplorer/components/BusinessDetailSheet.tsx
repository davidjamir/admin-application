"use client"

import React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase,
  LayoutDashboard,
  Flag,
  Users2,
  Package,
  Megaphone,
  AppWindow,
  BadgeCheck,
  RefreshCw,
} from "lucide-react"
import { BusinessRow, SystemUser } from "@/types/facebook"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { OverviewTab } from "./BusinessDetail/OverviewTab"
import { TeamTab } from "./BusinessDetail/TeamTab"
import { PagesTab } from "./BusinessDetail/PagesTab"
import { AssetsTab } from "./BusinessDetail/AssetsTab"
import { ApplicationsTab } from "./BusinessDetail/ApplicationsTab"
import { AdsManagerTab } from "./BusinessDetail/AdsManagerTab"

interface BusinessDetailSheetProps {
  business: BusinessRow | null
  isOpen: boolean
  onClose: () => void
  systemUsers: SystemUser[]
  currentUser: SystemUser | null
  lastSync?: string
  onRecrawl?: () => void
  isRecrawling?: boolean
  adminToken: string
}

export function BusinessDetailSheet({ business, isOpen, onClose, systemUsers, currentUser, lastSync, onRecrawl, isRecrawling, adminToken }: BusinessDetailSheetProps) {
  if (!business) return null

  const allBusinessUsers = [...(business.business_users?.data || [])]
  const isCurrentUserInList = allBusinessUsers.some(u => u.id === currentUser?.id)

  if (currentUser && !isCurrentUserInList) {
    allBusinessUsers.unshift({
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email || "",
      role: "Current Agent"
    })
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="!w-[60%] !max-w-none p-0 border-l border-border/50 bg-card/95 backdrop-blur-xl overflow-y-auto">
        <div className="h-full flex flex-col">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <SheetHeader className="px-6 pt-6 border-b border-border/50 bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <SheetTitle className="text-xl font-normal tracking-tight flex items-center flex-wrap gap-2.5">
                    <div className="flex items-center gap-3 shrink-0">
                      {business.name}
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium px-2 py-0.5 h-6 flex items-center gap-1.5 capitalize border",
                          business.verification_status === "verified"
                            ? "bg-blue-50 text-blue-600 border-blue-200"
                            : "bg-red-50 text-red-600 border-red-200"
                        )}
                      >
                        {business.verification_status === "verified" ? (
                          <>
                            <BadgeCheck className="w-3.5 h-3.5 fill-blue-600/10" />
                            Verified
                          </>
                        ) : (
                          <>
                            <BadgeCheck className="w-3.5 h-3.5 fill-red-600/10" />
                            Unverified
                          </>
                        )}
                      </Badge>
                      {business.permitted_roles && business.permitted_roles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {business.permitted_roles.map((r, i) => (
                            <Badge
                              key={i}
                              variant="outline"
                              className="text-[9px] font-medium px-2 py-0 h-4.5 bg-green-600/10 text-green-600 border-green-600/20 capitalize"
                            >
                              {r.toLowerCase()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </SheetTitle>
                  <div className="flex flex-col items-start gap-1 mt-1">
                    <div
                      className="text-xs font-mono hover:text-primary cursor-pointer transition-colors w-fit text-muted-foreground"
                      onClick={() => {
                        navigator.clipboard.writeText(business.id)
                        toast.success("Business ID copied")
                      }}
                    >
                      ID: {business.id}
                    </div>

                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-[10px] text-muted-foreground/60 select-none italic cursor-pointer hover:text-primary transition-colors",
                        isRecrawling && "text-green-600/80"
                      )}
                      onClick={onRecrawl}
                    >
                      <span>Last Sync: {lastSync || "Just now"}</span>
                      <RefreshCw className={cn("w-2.5 h-2.5", isRecrawling && "animate-spin text-green-600")} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {business.vertical && <Badge variant="outline" className="text-[10px] font-normal capitalize">{business.vertical.toLowerCase()}</Badge>}
                {business.timezone_id && <Badge variant="outline" className="text-[10px] font-normal">UTC {business.timezone_id}</Badge>}
              </div>

              <div className="w-full mt-6">
                <TabsList variant="line" className="justify-start gap-1 bg-transparent p-0 h-auto border-b-0 w-fit">
                  <TabsTrigger
                    value="overview"
                    className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="team"
                    className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer"
                  >
                    <Users2 className="w-3.5 h-3.5" />
                    Team
                  </TabsTrigger>
                  <TabsTrigger
                    value="pages"
                    className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Pages
                  </TabsTrigger>
                  <TabsTrigger
                    value="assets"
                    className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5" />
                    Assets
                  </TabsTrigger>
                  <TabsTrigger
                    value="application"
                    className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer"
                  >
                    <AppWindow className="w-3.5 h-3.5" />
                    Applications
                  </TabsTrigger>
                  <TabsTrigger
                    value="ads"
                    className="flex items-center gap-2 px-3 py-1.5 h-8 text-[11px] font-normal transition-all hover:bg-muted/30 data-active:bg-muted/60 data-active:text-foreground data-active:shadow-none border-none rounded-md cursor-pointer"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    Ads Manager
                  </TabsTrigger>
                </TabsList>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-hidden relative">
              <TabsContent value="overview" className="m-0 focus-visible:outline-none h-full overflow-y-auto p-6 custom-scrollbar">
                <OverviewTab business={business} allBusinessUsersCount={allBusinessUsers.length} key={`overview-${business.id}`} />
              </TabsContent>

              <TabsContent value="team" className="m-0 focus-visible:outline-none h-full">
                <TeamTab
                  business={business}
                  systemUsers={systemUsers}
                  currentUser={currentUser}
                  allBusinessUsers={allBusinessUsers}
                  key={`team-${business.id}`}
                />
              </TabsContent>

              <TabsContent value="pages" className="m-0 focus-visible:outline-none h-full">
                <PagesTab business={business} key={`pages-${business.id}`} />
              </TabsContent>

              <TabsContent value="assets" className="m-0 focus-visible:outline-none h-full">
                <AssetsTab 
                  business={business} 
                  adminToken={adminToken} 
                  allBusinessUsers={allBusinessUsers}
                  key={`assets-${business.id}`} 
                />
              </TabsContent>

              <TabsContent value="application" className="m-0 focus-visible:outline-none h-full">
                <ApplicationsTab business={business} adminToken={adminToken} key={`apps-${business.id}`} />
              </TabsContent>

              <TabsContent value="ads" className="m-0 focus-visible:outline-none h-full">
                <AdsManagerTab business={business} key={`ads-${business.id}`} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  )
}


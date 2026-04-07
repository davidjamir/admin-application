"use client"

import * as React from "react"
import {
  LayoutDashboard,
  BarChart3,
  Layers,
  Calendar,
  Settings,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Bell,
  Sparkles,
  Briefcase,
  Globe,
  ImagePlay,
  ShieldCheck,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SessionUser } from "@/lib/auth/session"
import { cn } from "@/lib/utils"

// Sample navigation data
const navItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    isActive: false, // Initially false, will be determined by pathname
  },
  {
    title: "Pages Management",
    url: "/pages",
    icon: Layers,
  },
  {
    title: "Content & Schedules",
    url: "/schedules",
    icon: Calendar,
  },
  {
    title: "Business Manager",
    url: "/business-manager",
    icon: Briefcase,
  },
  {
    title: "Websites Manager",
    url: "/website-manager",
    icon: Globe,
  },
  {
    title: "Ad Creatives",
    url: "/ad-creatives",
    icon: ImagePlay,
  },
]

const settingsItems = [
  {
    title: "Traffic Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: SessionUser | null;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { isMobile, state } = useSidebar()
  const pathname = usePathname()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent">
              <Link href="/" className="flex items-center w-full justify-start gap-3">
                <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-blue-600 text-primary-foreground shadow-lg shadow-primary/20 shrink-0 transition-all duration-200 group-data-[collapsible=icon]:size-8">
                  <ShieldCheck className="size-6 transition-all duration-200 group-data-[collapsible=icon]:size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none transition-all duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden">
                  <span className="font-bold text-lg tracking-tight truncate">7 Forge Inc</span>
                  <span className="text-[10px] tracking-widest text-muted-foreground font-semibold truncate">Admin System</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation Group */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Secondary Navigation Group */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarMenu>
            {settingsItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-9 w-9 rounded-lg">
                    <AvatarImage src="/avatars/admin.jpg" alt="Admin" />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">AD</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                    <span className="truncate font-semibold tracking-tight">
                      {user?.name || "7 Forge Admin"}
                    </span>
                    <span className="truncate text-[10px] text-muted-foreground">
                      {user?.email || "admin@7forge.com"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src="/avatars/shadcn.jpg" alt="shadcn" />
                      <AvatarFallback className="rounded-lg">SC</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user?.name || "Admin"}</span>
                      <span className="truncate text-xs">{user?.email || "admin@7forge.com"}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles className="mr-2 size-4" />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Settings className="mr-2 size-4" />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 size-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell className="mr-2 size-4" />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={async () => {
                  await fetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/login";
                }} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

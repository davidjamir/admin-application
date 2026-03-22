"use client"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function DashboardHeader() {
  const pathname = usePathname()
  
  // Exact mapping matching the sidebar navigation
  const routeMap: Record<string, string> = {
    "/": "Dashboard",
    "/pages": "Pages Management",
    "/schedules": "Content & Schedules",
    "/analytics": "Traffic Analytics",
    "/settings": "Settings",
    "/business-manager": "Business Manager",
    "/website-manager": "Websites Manager",
    "/ad-creatives": "Ad Creatives",
  }

  const formattedTitle = routeMap[pathname] || "Dashboard"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/">7 Forge Inc</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{formattedTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden w-full max-w-sm md:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
          />
        </div>
        <ThemeToggle />
      </div>
    </header>
  )
}

"use client"

import type { OriginDocument } from "@/types/origin"
import {
  Globe,
  Palette,
  FileText,
  LayoutTemplate,
  PanelBottom,
  PanelLeft,
  PanelRight,
  ArrowUpToLine,
  ArrowDownToLine,
  BetweenHorizontalStart,
  Video,
  Code2,
  Search,
  Share2,
  BarChart3,
  Layers,
  FolderTree,
  Network,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Megaphone,
  SlidersHorizontal,
} from "lucide-react"
import { useMemo, useState } from "react"

export type TreeItem = {
  id: string
  label: string
  icon: typeof Globe
  badge?: string | number
  status?: "on" | "off"
}

export type TreeSubGroup = {
  id: string
  label: string
  items: TreeItem[]
}

export type TreeCategory = {
  id: string
  title: string
  icon: typeof Globe
  subGroups?: TreeSubGroup[]
  items?: TreeItem[]
}

export function OriginNavTree({
  origin,
  activeSection,
  onSelectSection,
}: {
  origin: OriginDocument | null
  activeSection: string
  onSelectSection: (sectionId: string) => void
}) {
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    general: true,
    ads: true,
    ads_placements: true,
    scripts: true,
    content: true,
  })

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }

  const adsScript = origin?.ads?.adsScript ?? {}
  const adsHeaderCount = adsScript.adsHeader?.length ?? 0
  const adsFooterCount = adsScript.adsFooter?.length ?? 0
  const adsLeftCount = adsScript.adsLeftSidebar?.length ?? 0
  const adsRightCount = adsScript.adsRightSidebar?.length ?? 0
  const inPostCount = adsScript.adsBody?.inPost?.length ?? 0
  const beforePostActive = adsScript.adsBody?.beforePost?.enabled
  const afterPostActive = adsScript.adsBody?.afterPost?.enabled
  const videoHeaderActive = adsScript.adsVideoHeader?.enabled

  const scriptsCount = origin?.script?.length ?? 0
  const pagesCount = origin?.pages?.length ?? 0
  const categoriesCount = origin?.categories?.length ?? 0
  const adsTxtLines = origin?.ads?.adsTxt ? origin.ads.adsTxt.split("\n").length : 0

  const categories: TreeCategory[] = useMemo(() => {
    return [
      {
        id: "general",
        title: "General & Branding",
        icon: SlidersHorizontal,
        items: [
          {
            id: "identity",
            label: "Identity & Domain",
            icon: Globe,
          },
          {
            id: "appearance",
            label: "Appearance & Theme",
            icon: Palette,
            status: origin?.config?.enabledAds ? "on" : "off",
          },
        ],
      },
      {
        id: "ads",
        title: "Ads Management",
        icon: Megaphone,
        items: [
          {
            id: "ads-txt",
            label: "ads.txt",
            icon: FileText,
            badge: `${adsTxtLines} lines`,
          },
          {
            id: "ads-header",
            label: "Header Ads",
            icon: LayoutTemplate,
            badge: adsHeaderCount > 0 ? adsHeaderCount : undefined,
          },
          {
            id: "ads-footer",
            label: "Footer Ads",
            icon: PanelBottom,
            badge: adsFooterCount > 0 ? adsFooterCount : undefined,
          },
          {
            id: "ads-left",
            label: "Left Sidebar",
            icon: PanelLeft,
            badge: adsLeftCount > 0 ? adsLeftCount : undefined,
          },
          {
            id: "ads-right",
            label: "Right Sidebar",
            icon: PanelRight,
            badge: adsRightCount > 0 ? adsRightCount : undefined,
          },
          {
            id: "ads-before-post",
            label: "Before Post",
            icon: ArrowUpToLine,
            status: beforePostActive ? "on" : beforePostActive === false ? "off" : undefined,
          },
          {
            id: "ads-after-post",
            label: "After Post",
            icon: ArrowDownToLine,
            status: afterPostActive ? "on" : afterPostActive === false ? "off" : undefined,
          },
          {
            id: "ads-in-post",
            label: "In-Post Ads",
            icon: BetweenHorizontalStart,
            badge: inPostCount > 0 ? inPostCount : undefined,
          },
          {
            id: "ads-video-header",
            label: "Video Header",
            icon: Video,
            status: videoHeaderActive ? "on" : videoHeaderActive === false ? "off" : undefined,
          },
        ],
      },
      {
        id: "scripts",
        title: "Scripts & Tracking",
        icon: Code2,
        items: [
          {
            id: "scripts",
            label: "Head Scripts",
            icon: Code2,
            badge: scriptsCount > 0 ? scriptsCount : undefined,
          },
          {
            id: "analytics",
            label: "Analytics & Webmaster",
            icon: BarChart3,
          },
          {
            id: "networks",
            label: "Networks",
            icon: Network,
            badge: origin?.networks?.length ? origin.networks.length : undefined,
          },
        ],
      },
      {
        id: "content",
        title: "Content & Taxonomy",
        icon: Search,
        items: [
          {
            id: "seo",
            label: "SEO Metadata",
            icon: Search,
          },
          {
            id: "socials",
            label: "Social Links",
            icon: Share2,
          },
          {
            id: "pages",
            label: "Static Pages",
            icon: Layers,
            badge: pagesCount > 0 ? pagesCount : undefined,
          },
          {
            id: "categories",
            label: "Categories",
            icon: FolderTree,
            badge: categoriesCount > 0 ? categoriesCount : undefined,
          },
        ],
      },
    ]
  }, [
    origin?.config?.enabledAds,
    origin?.networks?.length,
    adsTxtLines,
    adsHeaderCount,
    adsFooterCount,
    adsLeftCount,
    adsRightCount,
    inPostCount,
    beforePostActive,
    afterPostActive,
    videoHeaderActive,
    scriptsCount,
    pagesCount,
    categoriesCount,
  ])

  const renderTreeItem = (item: TreeItem, depth = 1) => {
    const isActive = activeSection === item.id
    const Icon = item.icon

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onSelectSection(item.id)}
        className={`group flex w-full items-center justify-between gap-2 rounded-md py-1.5 pr-2 text-left text-xs font-medium transition-colors ${
          depth === 2 ? "pl-2.5" : "pl-2"
        } ${
          isActive
            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <Icon
            className={`size-3.5 shrink-0 ${
              isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
            }`}
          />
          <span className="truncate">{item.label}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {item.status ? (
            <span
              className={`inline-block size-1.5 rounded-full ${
                item.status === "on"
                  ? isActive
                    ? "bg-white"
                    : "bg-emerald-500"
                  : isActive
                    ? "bg-white/40"
                    : "bg-zinc-400 dark:bg-zinc-600"
              }`}
              title={`Status: ${item.status.toUpperCase()}`}
            />
          ) : null}

          {item.badge !== undefined ? (
            <span
              className={`rounded px-1.5 py-0.2 font-mono text-[10px] ${
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {item.badge}
            </span>
          ) : null}
        </div>
      </button>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      {/* Hierarchy Header */}
      <div className="border-b px-3.5 py-2.5 bg-muted/20">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Configuration Tree
        </span>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
        {categories.map((cat) => {
          const isExpanded = expandedFolders[cat.id] ?? true
          const CategoryIcon = isExpanded ? FolderOpen : Folder

          return (
            <div key={cat.id} className="space-y-0.5">
              {/* Category Node (Level 0) */}
              <button
                type="button"
                onClick={() => toggleFolder(cat.id)}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs font-semibold text-foreground/90 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  {isExpanded ? (
                    <ChevronDown className="size-3 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3 text-muted-foreground" />
                  )}
                  <CategoryIcon className="size-3.5 text-primary/80" />
                  <span className="tracking-tight">{cat.title}</span>
                </div>
              </button>

              {/* Children (Level 1 - Indented with tree connector line) */}
              {isExpanded && (
                <div className="ml-3.5 border-l-2 border-border/60 pl-2 space-y-0.5">
                  {/* Direct items */}
                  {cat.items?.map((item) => renderTreeItem(item, 1))}

                  {/* Sub-groups */}
                  {cat.subGroups?.map((subGroup) => {
                    const isSubExpanded = expandedFolders[subGroup.id] ?? true
                    const SubIcon = isSubExpanded ? FolderOpen : Folder

                    return (
                      <div key={subGroup.id} className="pt-0.5 space-y-0.5">
                        <button
                          type="button"
                          onClick={() => toggleFolder(subGroup.id)}
                          className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            {isSubExpanded ? (
                              <ChevronDown className="size-2.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="size-2.5 text-muted-foreground" />
                            )}
                            <SubIcon className="size-3 text-muted-foreground" />
                            <span>{subGroup.label}</span>
                          </div>
                          <span className="font-mono text-[10px] text-muted-foreground/70">
                            {subGroup.items.length}
                          </span>
                        </button>

                        {/* SubGroup Children (Level 2 - Further Indented) */}
                        {isSubExpanded && (
                          <div className="ml-2.5 border-l border-border/50 pl-2 space-y-0.5">
                            {subGroup.items.map((item) => renderTreeItem(item, 2))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import type {
  OriginAdUnit,
  OriginAdsScript,
  OriginCategory,
  OriginDocument,
  OriginPatchSection,
  OriginScript,
  OriginStaticPage,
} from "@/types/origin"
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
  Save,
  Loader2,
  Plus,
} from "lucide-react"
import { useCallback, useEffect } from "react"
import { toast } from "sonner"

import { IdentityEditor } from "./editors/IdentityEditor"
import { AppearanceEditor } from "./editors/AppearanceEditor"
import { AdsTxtEditor } from "./editors/AdsTxtEditor"
import { AdsPlacementsEditor, type AdPlacementKey, PLACEMENT_INFO } from "./editors/AdsPlacementsEditor"
import { HeadScriptsEditor } from "./editors/HeadScriptsEditor"
import { SeoEditor } from "./editors/SeoEditor"
import { AnalyticsVerificationEditor } from "./editors/AnalyticsVerificationEditor"
import { SocialsEditor } from "./editors/SocialsEditor"
import { StaticPagesEditor } from "./editors/StaticPagesEditor"
import { CategoriesEditor } from "./editors/CategoriesEditor"
import { NetworksEditor } from "./editors/NetworksEditor"

export function OriginDetailEditor({
  origin,
  activeSection,
  savingSection,
  onChange,
  onSave,
}: {
  origin: OriginDocument
  activeSection: string
  savingSection: OriginPatchSection | null
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
  onSave: (section: OriginPatchSection, data: unknown) => Promise<void>
}) {
  const getSectionMetadata = () => {
    switch (activeSection) {
      case "identity":
        return {
          title: "Identity & Domain",
          icon: Globe,
          sectionKey: "identity" as OriginPatchSection,
          getData: () => ({
            origin: origin.origin,
            icon: origin.icon ?? "",
            logo: origin.logo ?? "",
          }),
        }
      case "appearance":
        return {
          title: "Appearance & Theme",
          icon: Palette,
          sectionKey: "config" as OriginPatchSection,
          getData: () => origin.config ?? {},
        }
      case "ads-txt":
        return {
          title: "Ads.txt",
          icon: FileText,
          sectionKey: "adsTxt" as OriginPatchSection,
          getData: () => origin.ads?.adsTxt ?? "",
        }
      case "ads-header":
        return {
          title: "Header Ads (adsHeader)",
          icon: LayoutTemplate,
          sectionKey: "adsScript" as OriginPatchSection,
          getData: () => origin.ads?.adsScript ?? {},
        }
      case "ads-footer":
        return {
          title: "Footer Ads (adsFooter)",
          icon: PanelBottom,
          sectionKey: "adsScript" as OriginPatchSection,
          getData: () => origin.ads?.adsScript ?? {},
        }
      case "ads-left":
        return {
          title: "Left Sidebar Ads (adsLeftSidebar)",
          icon: PanelLeft,
          sectionKey: "adsScript" as OriginPatchSection,
          getData: () => origin.ads?.adsScript ?? {},
        }
      case "ads-right":
        return {
          title: "Right Sidebar Ads (adsRightSidebar)",
          icon: PanelRight,
          sectionKey: "adsScript" as OriginPatchSection,
          getData: () => origin.ads?.adsScript ?? {},
        }
      case "ads-before-post":
        return {
          title: "Before Post Slot (beforePost)",
          icon: ArrowUpToLine,
          sectionKey: "adsScript" as OriginPatchSection,
          getData: () => origin.ads?.adsScript ?? {},
        }
      case "ads-after-post":
        return {
          title: "After Post Slot (afterPost)",
          icon: ArrowDownToLine,
          sectionKey: "adsScript" as OriginPatchSection,
          getData: () => origin.ads?.adsScript ?? {},
        }
      case "ads-in-post":
        return {
          title: "In-Post Ads (inPost)",
          icon: BetweenHorizontalStart,
          sectionKey: "adsScript" as OriginPatchSection,
          getData: () => origin.ads?.adsScript ?? {},
        }
      case "ads-video-header":
        return {
          title: "Video Header Slot (adsVideoHeader)",
          icon: Video,
          sectionKey: "adsScript" as OriginPatchSection,
          getData: () => origin.ads?.adsScript ?? {},
        }
      case "scripts":
        return {
          title: "Head Injected Scripts",
          icon: Code2,
          sectionKey: "script" as OriginPatchSection,
          getData: () => origin.script ?? [],
        }
      case "analytics":
        return {
          title: "Analytics & Webmaster",
          icon: BarChart3,
          sectionKey: "analytics" as OriginPatchSection,
          getData: () => origin.analytics ?? {},
        }
      case "seo":
        return {
          title: "SEO Metadata",
          icon: Search,
          sectionKey: "seo" as OriginPatchSection,
          getData: () => origin.seo ?? {},
        }
      case "socials":
        return {
          title: "Social Media Links",
          icon: Share2,
          sectionKey: "socials" as OriginPatchSection,
          getData: () => origin.socials ?? {},
        }
      case "pages":
        return {
          title: "Static Pages",
          icon: Layers,
          sectionKey: "pages" as OriginPatchSection,
          getData: () => origin.pages ?? [],
        }
      case "categories":
        return {
          title: "Categories",
          icon: FolderTree,
          sectionKey: "categories" as OriginPatchSection,
          getData: () => origin.categories ?? [],
        }
      case "networks":
        return {
          title: "Networks",
          icon: Network,
          sectionKey: "networks" as OriginPatchSection,
          getData: () => origin.networks ?? [],
        }
      default:
        return {
          title: "Origin Configuration",
          icon: Globe,
          sectionKey: "identity" as OriginPatchSection,
          getData: () => origin,
        }
    }
  }

  const meta = getSectionMetadata()
  const isSaving = savingSection === meta.sectionKey
  const Icon = meta.icon

  const handleSave = useCallback(async () => {
    try {
      if (activeSection === "analytics") {
        await onSave("analytics", origin.analytics ?? {})
        if (origin.verification) {
          await onSave("verification", origin.verification)
        }
        return
      }
      await onSave(meta.sectionKey, meta.getData())
    } catch {
      // Error handled by toast
    }
  }, [activeSection, meta, onSave, origin])

  // Support Cmd+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        void handleSave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  // Handlers for Add action in sticky header
  const handleAddScript = useCallback(() => {
    const newScript: OriginScript = {
      id: `script-${crypto.randomUUID().slice(0, 6)}`,
      src: "",
      async: true,
      defer: false,
      crossOrigin: "anonymous",
      strategy: "afterInteractive",
      enabled: true,
    }
    onChange((prev) => ({
      ...prev,
      script: [...(prev.script ?? []), newScript],
    }))
    toast.success("Script added")
  }, [onChange])

  const handleAddAdUnit = useCallback((placementKey: AdPlacementKey) => {
    const info = PLACEMENT_INFO[placementKey]
    const newUnit: OriginAdUnit = {
      id: `${info.prefix}-${crypto.randomUUID().slice(0, 6)}`,
      source: "",
      content: "",
      enabled: true,
    }
    onChange((prev) => {
      const curr = prev.ads?.adsScript ?? {}
      let updatedScript: OriginAdsScript
      if (placementKey === "beforePost") {
        updatedScript = { ...curr, adsBody: { ...(curr.adsBody ?? {}), beforePost: newUnit } }
      } else if (placementKey === "afterPost") {
        updatedScript = { ...curr, adsBody: { ...(curr.adsBody ?? {}), afterPost: newUnit } }
      } else if (placementKey === "adsVideoHeader") {
        updatedScript = { ...curr, adsVideoHeader: newUnit }
      } else if (placementKey === "inPost") {
        const list = curr.adsBody?.inPost ?? []
        updatedScript = { ...curr, adsBody: { ...(curr.adsBody ?? {}), inPost: [...list, newUnit] } }
      } else {
        const list = curr[placementKey] ?? []
        updatedScript = { ...curr, [placementKey]: [...list, newUnit] }
      }
      return {
        ...prev,
        ads: {
          ...(prev.ads ?? {}),
          adsScript: updatedScript,
        },
      }
    })
    toast.success(info.isSingleton ? `${info.title} slot configured` : "New ad unit added")
  }, [onChange])

  const handleAddPage = useCallback(() => {
    const newPage: OriginStaticPage = {
      id: `page-${crypto.randomUUID().slice(0, 4)}`,
      name: "",
      slug: "",
    }
    onChange((prev) => ({
      ...prev,
      pages: [...(prev.pages ?? []), newPage],
    }))
    toast.success("Static page added")
  }, [onChange])

  const handleAddCategory = useCallback(() => {
    const newCat: OriginCategory = {
      id: `cat-${crypto.randomUUID().slice(0, 4)}`,
      name: "",
      slug: "",
    }
    onChange((prev) => ({
      ...prev,
      categories: [...(prev.categories ?? []), newCat],
    }))
    toast.success("Category added")
  }, [onChange])

  const getPrimaryAddAction = (): { label: string; onClick: () => void } | null => {
    switch (activeSection) {
      case "scripts":
        return { label: "Add Script", onClick: handleAddScript }
      case "ads-header":
        return { label: "Add Unit", onClick: () => handleAddAdUnit("adsHeader") }
      case "ads-footer":
        return { label: "Add Unit", onClick: () => handleAddAdUnit("adsFooter") }
      case "ads-left":
        return { label: "Add Unit", onClick: () => handleAddAdUnit("adsLeftSidebar") }
      case "ads-right":
        return { label: "Add Unit", onClick: () => handleAddAdUnit("adsRightSidebar") }
      case "ads-in-post":
        return { label: "Add Unit", onClick: () => handleAddAdUnit("inPost") }
      case "ads-before-post":
        if (!origin.ads?.adsScript?.adsBody?.beforePost) {
          return { label: "Add Unit", onClick: () => handleAddAdUnit("beforePost") }
        }
        return null
      case "ads-after-post":
        if (!origin.ads?.adsScript?.adsBody?.afterPost) {
          return { label: "Add Unit", onClick: () => handleAddAdUnit("afterPost") }
        }
        return null
      case "ads-video-header":
        if (!origin.ads?.adsScript?.adsVideoHeader) {
          return { label: "Add Unit", onClick: () => handleAddAdUnit("adsVideoHeader") }
        }
        return null
      case "pages":
        return { label: "Add Page", onClick: handleAddPage }
      case "categories":
        return { label: "Add Category", onClick: handleAddCategory }
      default:
        return null
    }
  }

  const primaryAddAction = getPrimaryAddAction()

  const getSectionStats = (): string | null => {
    switch (activeSection) {
      case "scripts": {
        const count = (origin.script ?? []).length
        return `${count} ${count === 1 ? "script" : "scripts"}`
      }
      case "ads-header": {
        const count = (origin.ads?.adsScript?.adsHeader ?? []).length
        return `${count} ${count === 1 ? "unit" : "units"}`
      }
      case "ads-footer": {
        const count = (origin.ads?.adsScript?.adsFooter ?? []).length
        return `${count} ${count === 1 ? "unit" : "units"}`
      }
      case "ads-left": {
        const count = (origin.ads?.adsScript?.adsLeftSidebar ?? []).length
        return `${count} ${count === 1 ? "unit" : "units"}`
      }
      case "ads-right": {
        const count = (origin.ads?.adsScript?.adsRightSidebar ?? []).length
        return `${count} ${count === 1 ? "unit" : "units"}`
      }
      case "ads-in-post": {
        const count = (origin.ads?.adsScript?.adsBody?.inPost ?? []).length
        return `${count} ${count === 1 ? "unit" : "units"}`
      }
      case "ads-before-post": {
        const isConfigured = Boolean(origin.ads?.adsScript?.adsBody?.beforePost)
        return isConfigured ? "1 unit" : "0 units"
      }
      case "ads-after-post": {
        const isConfigured = Boolean(origin.ads?.adsScript?.adsBody?.afterPost)
        return isConfigured ? "1 unit" : "0 units"
      }
      case "ads-video-header": {
        const isConfigured = Boolean(origin.ads?.adsScript?.adsVideoHeader)
        return isConfigured ? "1 unit" : "0 units"
      }
      case "pages": {
        const count = (origin.pages ?? []).length
        return `${count} ${count === 1 ? "page" : "pages"}`
      }
      case "categories": {
        const count = (origin.categories ?? []).length
        return `${count} ${count === 1 ? "category" : "categories"}`
      }
      default:
        return null
    }
  }

  const sectionStats = getSectionStats()

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      {/* Sticky Header with Action Buttons */}
      <div className="flex items-center justify-between gap-4 border-b bg-muted/20 px-6 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-mono">{origin.origin}</span>
              <span>/</span>
              <span className="font-semibold text-foreground">{meta.title}</span>
            </div>
            {sectionStats && (
              <span className="rounded-md border border-border/70 bg-muted/60 px-2 py-0.5 font-mono text-[11px] font-medium text-foreground/80">
                {sectionStats}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {primaryAddAction && (
            <Button
              type="button"
              onClick={primaryAddAction.onClick}
              className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors"
            >
              <Plus className="size-3.5 mr-1" />
              <span>{primaryAddAction.label}</span>
            </Button>
          )}

          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="h-8 px-3.5 text-xs font-medium"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            <span>{isSaving ? "Saving…" : "Save Changes"}</span>
            <kbd className="hidden rounded bg-primary-foreground/20 px-1 py-0.2 font-mono text-[9px] text-primary-foreground md:inline-block ml-1">
              ⌘S
            </kbd>
          </Button>
        </div>
      </div>

      {/* Scrollable Editor Body - No bottom save button */}
      <div
        className={`flex-1 p-6 ${
          activeSection === "ads-txt"
            ? "flex flex-col min-h-0 overflow-hidden"
            : "overflow-y-auto max-h-full"
        }`}
      >
        {activeSection === "identity" && (
          <IdentityEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "appearance" && (
          <AppearanceEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "ads-txt" && (
          <AdsTxtEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "ads-header" && (
          <AdsPlacementsEditor
            origin={origin}
            placementKey="adsHeader"
            onChange={onChange}
          />
        )}

        {activeSection === "ads-footer" && (
          <AdsPlacementsEditor
            origin={origin}
            placementKey="adsFooter"
            onChange={onChange}
          />
        )}

        {activeSection === "ads-left" && (
          <AdsPlacementsEditor
            origin={origin}
            placementKey="adsLeftSidebar"
            onChange={onChange}
          />
        )}

        {activeSection === "ads-right" && (
          <AdsPlacementsEditor
            origin={origin}
            placementKey="adsRightSidebar"
            onChange={onChange}
          />
        )}

        {activeSection === "ads-before-post" && (
          <AdsPlacementsEditor
            origin={origin}
            placementKey="beforePost"
            onChange={onChange}
          />
        )}

        {activeSection === "ads-after-post" && (
          <AdsPlacementsEditor
            origin={origin}
            placementKey="afterPost"
            onChange={onChange}
          />
        )}

        {activeSection === "ads-in-post" && (
          <AdsPlacementsEditor
            origin={origin}
            placementKey="inPost"
            onChange={onChange}
          />
        )}

        {activeSection === "ads-video-header" && (
          <AdsPlacementsEditor
            origin={origin}
            placementKey="adsVideoHeader"
            onChange={onChange}
          />
        )}

        {activeSection === "scripts" && (
          <HeadScriptsEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "analytics" && (
          <AnalyticsVerificationEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "seo" && (
          <SeoEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "socials" && (
          <SocialsEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "pages" && (
          <StaticPagesEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "categories" && (
          <CategoriesEditor origin={origin} onChange={onChange} />
        )}

        {activeSection === "networks" && (
          <NetworksEditor key={origin._id} origin={origin} onChange={onChange} />
        )}
      </div>
    </div>
  )
}

"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useOriginConfig } from "@/hooks/useOriginConfig"
import {
  Globe,
  Loader2,
  RefreshCw,
  Search,
  Check,
  ChevronDown,
  AlertCircle,
} from "lucide-react"
import { useState } from "react"
import { OriginNavTree } from "./OriginNavTree"
import { OriginDetailEditor } from "./OriginDetailEditor"

export function OriginConfigView() {
  const {
    origins,
    filteredOrigins,
    listLoading,
    query,
    setQuery,
    selectedId,
    origin,
    updateOrigin,
    loadingOrigin,
    savingSection,
    isDirty,
    loadList,
    loadOrigin,
    saveSection,
  } = useOriginConfig()

  const [activeSection, setActiveSection] = useState("identity")
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const selectedOriginItem = origins.find((item) => item._id === selectedId)

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-100px)] min-h-[660px]">
      {/* Top Bar: Domain Select on the Top-Left + Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Domain Selector Dropdown (Top-Left) */}
          <div className="flex items-center gap-2">
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-10 min-w-64 justify-between gap-3 border-border/80 bg-card px-3 shadow-xs hover:bg-muted/50"
                  disabled={listLoading}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                      <Globe className="size-3.5" />
                    </div>
                    <span className="font-semibold text-sm truncate">
                      {selectedOriginItem ? selectedOriginItem.origin : "Select origin domain…"}
                    </span>
                  </div>
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground opacity-60" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="start"
                className="w-80 p-2 shadow-lg"
              >
                <div className="p-1 pb-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search domains…"
                      className="h-8 pl-8 text-xs bg-background"
                      autoFocus
                    />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Origins List ({filteredOrigins.length})
                </DropdownMenuLabel>
                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {filteredOrigins.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      No matching domains found
                    </div>
                  ) : (
                    filteredOrigins.map((item) => {
                      const isSelected = item._id === selectedId
                      return (
                        <DropdownMenuItem
                          key={item._id}
                          onClick={() => {
                            void loadOrigin(item._id)
                            setDropdownOpen(false)
                          }}
                          className={`flex items-center justify-between gap-2 px-2.5 py-2 cursor-pointer rounded-lg text-xs ${
                            isSelected ? "bg-primary/10 font-semibold text-primary" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isSelected ? (
                              <Check className="size-3.5 shrink-0 text-primary" />
                            ) : (
                              <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate">{item.origin}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.totalItems} items
                            </span>
                            <span
                              className={`size-2 rounded-full ${
                                item.enabledAds ? "bg-emerald-500" : "bg-muted-foreground/30"
                              }`}
                              title={item.enabledAds ? "Ads ON" : "Ads OFF"}
                            />
                          </div>
                        </DropdownMenuItem>
                      )
                    })
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Quick Reload Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0"
              onClick={() => void loadList(true)}
              disabled={listLoading}
              title="Reload origins list"
            >
              <RefreshCw className={`size-4 ${listLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Quick Badges of Current Origin */}
          {selectedOriginItem ? (
            <div className="hidden sm:flex items-center gap-2">
              <Badge
                variant={selectedOriginItem.enabledAds ? "default" : "secondary"}
                className={`text-[11px] font-medium ${
                  selectedOriginItem.enabledAds
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : ""
                }`}
              >
                {selectedOriginItem.enabledAds ? "Ads Enabled" : "Ads Disabled"}
              </Badge>
              <Badge variant="outline" className="font-mono text-[11px]">
                {selectedOriginItem.totalItems.toLocaleString()} items
              </Badge>
            </div>
          ) : null}
        </div>

        {/* Right side: unsaved indicator or last-updated timestamp */}
        <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          {isDirty && origin ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3 shrink-0" />
              Unsaved changes on <span className="font-mono font-semibold">{origin.origin}</span>
            </span>
          ) : origin?.updatedAt ? (
            <span>Updated: {new Date(origin.updatedAt).toLocaleString("en-US")}</span>
          ) : null}
        </div>
      </div>

      {/* Main Content: Split Screen Layout (Left Tree - Right Detail Editor) */}
      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden min-h-0">
        {/* Left Half: Navigation Tree */}
        <div className="col-span-12 md:col-span-4 lg:col-span-3 h-full overflow-hidden">
          <OriginNavTree
            origin={origin}
            activeSection={activeSection}
            onSelectSection={setActiveSection}
          />
        </div>

        {/* Right Half: Detail Editor Panel */}
        <div className="col-span-12 md:col-span-8 lg:col-span-9 h-full overflow-hidden">
          {loadingOrigin ? (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border bg-card text-muted-foreground space-y-3">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm">Loading origin configuration…</p>
            </div>
          ) : origin ? (
            <OriginDetailEditor
              origin={origin}
              activeSection={activeSection}
              savingSection={savingSection}
              onChange={updateOrigin}
              onSave={saveSection}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed bg-card/40 p-8 text-center text-muted-foreground space-y-3">
              <Globe className="size-10 text-muted-foreground/40" />
              <p className="text-sm font-medium">Please select an origin domain to view and edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

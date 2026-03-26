"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, Copy, Search } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BusinessDetailSheet } from "./BusinessDetailSheet"
import { BusinessRow } from "@/types/facebook"
import { FacebookPage } from "@/types/facebook"
import { Badge } from "@/components/ui/badge"

interface AccountUserModeProps {
  loading: boolean
  manualToken: string
  setManualToken: (val: string) => void
  handleManualSync: () => Promise<void>
  businessRows: BusinessRow[]
  isDetailSheetOpen: boolean
  setIsDetailSheetOpen: (val: boolean) => void
  selectedBusiness: BusinessRow | null
  openBusinessDetail: (business: BusinessRow) => void
}

export function AccountUserMode({
  loading,
  manualToken,
  setManualToken,
  handleManualSync,
  businessRows,
  standalonePages = [],
  isDetailSheetOpen,
  setIsDetailSheetOpen,
  selectedBusiness,
  openBusinessDetail,
}: AccountUserModeProps & { standalonePages?: FacebookPage[] }) {
  const [selectedBusinessIds, setSelectedBusinessIds] = useState<string[]>([])
  const [selectedStandalonePageIds, setSelectedStandalonePageIds] = useState<string[]>([])

  const handleCopyToken = () => {
    if (manualToken) {
      navigator.clipboard.writeText(manualToken)
      toast.success("Access Token copied to clipboard")
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Token Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 group">
          <input
            type="text"
            placeholder="EAASyCcEMf0sBRA1ahCTtzRh9CgNVFSxp4TeFl... (Access Token)"
            className="w-full h-11 px-4 py-2 rounded-xl border border-border/60 bg-background/50 text-sm font-mono focus:ring-2 focus:ring-primary/20 hover:border-primary/40 transition-all outline-none pr-12"
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
          />
          <div className="absolute right-1 top-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={handleCopyToken}
              disabled={!manualToken}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-11 px-6 gap-2 font-normal shadow-sm hover:shadow-md transition-all border border-green-600 text-green-600 rounded-xl bg-transparent hover:bg-green-50/50 hover:text-green-600 cursor-pointer"
          onClick={handleManualSync}
          disabled={loading || !manualToken}
        >
          <RefreshCcw className={`h-4 w-4 text-green-600 ${loading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      {/* Business Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-normal tracking-tighter text-black">Businesses</h2>
          <div className="text-[10px] text-black/40 tracking-wider">
            items: {businessRows.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-background/30 overflow-hidden shadow-inner">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50 h-11">
                <TableHead className="w-16 text-sm font-bold text-black text-center px-6">#</TableHead>
                <TableHead className="text-sm font-bold text-black px-6">Business ID</TableHead>
                <TableHead className="text-sm font-bold text-black px-6">Business Name</TableHead>
                <TableHead className="text-sm font-bold text-black px-6 text-center">Status</TableHead>
                <TableHead className="text-sm font-bold text-black px-6 text-center">Role</TableHead>
                <TableHead className="text-sm font-bold text-black px-6 text-center">Actions</TableHead>
                <TableHead className="w-16 px-6 text-right">
                    <Checkbox 
                        checked={businessRows.length > 0 && selectedBusinessIds.length === businessRows.length}
                        onCheckedChange={(checked) => {
                            if (checked) setSelectedBusinessIds(businessRows.map(bm => bm.id))
                            else setSelectedBusinessIds([])
                        }}
                        className="h-5 w-5 rounded-md border-border/60"
                    />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600/20" />
                    <p className="mt-4 text-[10px] font-normal tracking-widest text-black/20 capitalize">Refreshing assets...</p>
                  </TableCell>
                </TableRow>
              ) : businessRows.length > 0 ? (
                businessRows.map((bm, index) => (
                  <TableRow 
                    key={bm.id} 
                    className={`group border-border/20 transition-all duration-300 cursor-pointer h-14 ${selectedBusinessIds.includes(bm.id) ? "bg-primary/[0.03]" : "hover:bg-muted/40"}`}
                    onClick={() => openBusinessDetail(bm)}
                  >
                    <TableCell className="text-center text-black font-normal text-sm w-16 px-6">{index + 1}</TableCell>
                    <TableCell className="px-6 font-mono text-sm text-black/80">{bm.id}</TableCell>
                    <TableCell className="px-6 text-sm text-black tracking-tight font-normal">{bm.name}</TableCell>
                    <TableCell className="px-6 text-center">
                      <Badge 
                        variant={bm.verification_status === "verified" ? "default" : "secondary"} 
                        className={`text-[10px] font-normal py-0.5 h-6 px-3 border-none shadow-sm ${
                          bm.verification_status === "verified" 
                            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" 
                            : "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20"
                        }`}
                      >
                        {bm.verification_status === "verified" ? "Verified" : (bm.verification_status || "Unknown")}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 text-center">
                      <div className="flex flex-wrap justify-center gap-1">
                        {bm.permitted_roles?.map(role => (
                          <Badge key={role} variant="outline" className="text-[10px] capitalize font-normal py-0 h-5 bg-background/50">
                            {role.toLowerCase()}
                          </Badge>
                        )) || <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 text-center" />
                    <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                        <Checkbox 
                            checked={selectedBusinessIds.includes(bm.id)}
                            onCheckedChange={(checked) => {
                                setSelectedBusinessIds(prev => checked ? [...prev, bm.id] : prev.filter(id => id !== bm.id))
                            }}
                            className="h-5 w-5 rounded-md border-border/60"
                        />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                       <Search className="h-6 w-6 opacity-20" />
                       <span className="text-xs italic tracking-widest font-normal text-black/20 capitalize">No businesses found</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pages Outside Business Table */}
      <div className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-normal tracking-tighter text-black">Pages Outside Business</h2>
          <div className="text-[10px] text-black/40 tracking-wider">
            items: {standalonePages.length}
          </div>
        </div>
        <div className="rounded-2xl border border-border/40 bg-background/30 overflow-hidden shadow-inner">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border/50 h-11">
                <TableHead className="w-16 text-sm font-bold text-black text-center px-6">#</TableHead>
                <TableHead className="text-sm font-bold text-black px-6">Page ID</TableHead>
                <TableHead className="text-sm font-bold text-black px-6">Page Name</TableHead>
                <TableHead className="text-sm font-bold text-black px-6">Category</TableHead>
                <TableHead className="text-sm font-bold text-black px-6 text-center">Actions</TableHead>
                <TableHead className="w-16 px-6 text-right">
                    <Checkbox 
                        checked={standalonePages.length > 0 && selectedStandalonePageIds.length === standalonePages.length}
                        onCheckedChange={(checked) => {
                            if (checked) setSelectedStandalonePageIds(standalonePages.map(p => p.id))
                            else setSelectedStandalonePageIds([])
                        }}
                        className="h-5 w-5 rounded-md border-border/60"
                    />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-green-600/20" />
                    <p className="mt-4 text-[10px] font-normal tracking-widest text-black/20 capitalize">Discovering pages...</p>
                  </TableCell>
                </TableRow>
              ) : standalonePages.length > 0 ? (
                standalonePages.map((page, index) => (
                  <TableRow 
                    key={page.id} 
                    className={`group border-border/20 transition-all duration-300 h-14 cursor-pointer ${selectedStandalonePageIds.includes(page.id) ? "bg-primary/[0.03]" : "hover:bg-muted/40"}`}
                    onClick={() => {
                        const isChecked = selectedStandalonePageIds.includes(page.id)
                        setSelectedStandalonePageIds(prev => isChecked ? prev.filter(id => id !== page.id) : [...prev, page.id])
                    }}
                  >
                    <TableCell className="text-center text-black font-normal text-sm w-16 px-6">{index + 1}</TableCell>
                    <TableCell className="px-6 font-mono text-sm text-black/80">{page.id}</TableCell>
                    <TableCell className="px-6 text-sm text-black tracking-tight font-normal">{page.name}</TableCell>
                    <TableCell className="px-6 text-right">
                      <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-3 font-normal capitalize">
                        {(page.category || "").toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 text-center" />
                    <TableCell className="px-6 text-right" onClick={e => e.stopPropagation()}>
                        <Checkbox 
                            checked={selectedStandalonePageIds.includes(page.id)}
                            onCheckedChange={(checked) => {
                                setSelectedStandalonePageIds(prev => checked ? [...prev, page.id] : prev.filter(id => id !== page.id))
                            }}
                            className="h-5 w-5 rounded-md border-border/60"
                        />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Search className="h-6 w-6 opacity-20" />
                        <span className="text-xs italic tracking-widest font-normal text-black/20 capitalize">No pages outside business</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <BusinessDetailSheet
        business={selectedBusiness}
        isOpen={isDetailSheetOpen}
        onClose={() => setIsDetailSheetOpen(false)}
      />
    </div>
  )
}

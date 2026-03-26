'use client'

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, Key } from "lucide-react"

import { useTokenIngestion } from "@/hooks/useTokenIngestion"
import { DiscoveryPipeline } from "./TokenIngestion/components/DiscoveryPipeline"
import { AssetTable } from "./TokenIngestion/components/AssetTable"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function TokenIngestion({ adminPassword, isAdminVerified }: Props) {
    const {
        status, selectedBmFilter, setSelectedBmFilter,
        selectedSystemUserId, setSelectedSystemUserId, pages,
        selectedPageIds, setSelectedPageIds, saving, loadingPages,
        bmFilterOptions, filteredSystemUsers, activePart,
        handlePageSave, handleSelectThird
    } = useTokenIngestion(adminPassword, isAdminVerified)

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden border-t-primary/20">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl tracking-tight text-black">Token Ingestion Hub</CardTitle>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Activity className="w-3 h-3 text-primary animate-pulse" />
                                <p className="text-[10px] font-medium text-muted-foreground tracking-widest">{status}</p>
                            </div>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background/50 border-primary/20 text-primary">
                        v3.0 Enterprise
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                <DiscoveryPipeline 
                    selectedBmFilter={selectedBmFilter}
                    setSelectedBmFilter={setSelectedBmFilter}
                    bmFilterOptions={bmFilterOptions}
                    selectedSystemUserId={selectedSystemUserId}
                    setSelectedSystemUserId={setSelectedSystemUserId}
                    filteredSystemUsers={filteredSystemUsers}
                    loadingPages={loadingPages}
                    saving={saving}
                    isAdminVerified={isAdminVerified}
                    pages={pages}
                    selectedPageIds={selectedPageIds}
                    handlePageSave={handlePageSave}
                />

                <AssetTable 
                    pages={pages}
                    selectedPageIds={selectedPageIds}
                    setSelectedPageIds={setSelectedPageIds}
                    loadingPages={loadingPages}
                    activePart={activePart}
                    handleSelectThird={handleSelectThird}
                />
            </CardContent>
        </Card>
    )
}

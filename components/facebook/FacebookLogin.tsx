'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key } from "lucide-react"
import { useFacebookDiscovery } from "@/hooks/useFacebookDiscovery"
import { DiscoveryControls } from "./Discovery/DiscoveryControls"
import { DiscoveryTable } from "./Discovery/DiscoveryTable"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function FacebookLogin({ adminPassword, isAdminVerified }: Props) {
    const {
        status, systemUsers, selectedSystemUserId, setSelectedSystemUserId,
        pages, selectedPageIds, setSelectedPageIds, saving, loadingPages,
        selectedUser, handlePageSave, handleCopy
    } = useFacebookDiscovery(adminPassword, isAdminVerified)

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Key className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-black font-bold">Token Ingestion Manager</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{status}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background/50 text-black">
                        Ingestion Module v2.0
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                <DiscoveryControls 
                    isAdminVerified={isAdminVerified}
                    systemUsers={systemUsers}
                    selectedSystemUserId={selectedSystemUserId}
                    setSelectedSystemUserId={setSelectedSystemUserId}
                    selectedUser={selectedUser}
                    handlePageSave={handlePageSave}
                    saving={saving}
                    loadingPages={loadingPages}
                    pagesCount={pages.length}
                    selectedPageIdsCount={selectedPageIds.length}
                />

                <DiscoveryTable 
                    loadingPages={loadingPages}
                    pages={pages}
                    selectedPageIds={selectedPageIds}
                    setSelectedPageIds={setSelectedPageIds}
                    handleCopy={handleCopy}
                />
            </CardContent>
        </Card>
    )
}

'use client'

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

import { useSystemUserManagement } from "@/hooks/useSystemUserManagement"
import { IngestionControls } from "./SystemUserManager/components/IngestionControls"
import { UserTable } from "./SystemUserManager/components/UserTable"
import { DeleteDialog } from "./SystemUserManager/components/DeleteDialog"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function SystemUserManager({ adminPassword, isAdminVerified }: Props) {
    const {
        status, crawlToken, setCrawlToken, crawling, saving,
        selectedBmFilter, setSelectedBmFilter, search, setSearch, recrawlingIds,
        deletingUser, handleCrawl, handleSave, handleRecrawl,
        handleDelete, confirmDelete, bmFilterOptions, filteredUsers, setDeletingUser
    } = useSystemUserManagement(adminPassword, isAdminVerified)

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg text-black">Personnel Management</CardTitle>
                            <p className="text-xs text-muted-foreground mt-0.5">{status}</p>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono bg-background/50 text-black">
                        System User Module v2.0
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                <IngestionControls 
                    crawlToken={crawlToken}
                    setCrawlToken={setCrawlToken}
                    handleCrawl={handleCrawl}
                    crawling={crawling}
                />

                <UserTable 
                    users={filteredUsers}
                    search={search}
                    setSearch={setSearch}
                    selectedBmFilter={selectedBmFilter}
                    setSelectedBmFilter={setSelectedBmFilter}
                    bmFilterOptions={bmFilterOptions}
                    recrawlingIds={recrawlingIds}
                    saving={saving}
                    handleRecrawl={handleRecrawl}
                    handleSave={handleSave}
                    handleDelete={handleDelete}
                />
            </CardContent>

            <DeleteDialog 
                user={deletingUser}
                onClose={() => setDeletingUser(null)}
                onConfirm={confirmDelete}
                saving={saving}
            />
        </Card>
    )
}

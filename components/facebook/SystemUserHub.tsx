'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Sheet } from "@/components/ui/sheet"
import { useSystemUserHub } from "@/hooks/useSystemUserHub"
import { HubHeader } from "./SystemUser/HubHeader"
import { HubFilters } from "./SystemUser/HubFilters"
import { AddUserSheet } from "./SystemUser/AddUserSheet"
import { SystemUserTable } from "./SystemUser/SystemUserTable"
import { EditUserSheet } from "./SystemUser/EditUserSheet"
import { DeleteUserDialog } from "./SystemUser/DeleteUserDialog"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function SystemUserHub({ adminPassword, isAdminVerified }: Props) {
    const {
        isSheetOpen, setIsSheetOpen, status, loadingUsers,
        crawling, saving, selectedBmFilter, setSelectedBmFilter,
        selectedStatusFilter, setSelectedStatusFilter,
        search, setSearch, recrawlingIds, deletingUser, setDeletingUser,
        editingUser, setEditingUser, addForm, setAddForm, editForm, setEditForm,
        loadSystemUsers, handleSave, handleRecrawl, confirmDelete,
        handleEditStart, handleEditSave, bmFilterOptions, filteredUsers
    } = useSystemUserHub(adminPassword, isAdminVerified)

    return (
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden border-t-primary/20">
            <HubHeader status={status} />

            <CardContent className="p-6 space-y-6">
                <HubFilters 
                    search={search}
                    setSearch={setSearch}
                    selectedBmFilter={selectedBmFilter}
                    setSelectedBmFilter={setSelectedBmFilter}
                    bmFilterOptions={bmFilterOptions}
                    loadingUsers={loadingUsers}
                    onRefresh={() => void loadSystemUsers(adminPassword)}
                    isSheetOpen={isSheetOpen}
                    setIsSheetOpen={setIsSheetOpen}
                    selectedStatusFilter={selectedStatusFilter}
                    setSelectedStatusFilter={setSelectedStatusFilter}
                />

                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <AddUserSheet 
                        isSheetOpen={isSheetOpen}
                        setIsSheetOpen={setIsSheetOpen}
                        addForm={addForm}
                        setAddForm={setAddForm}
                        crawling={crawling}
                        saving={saving}
                        handleSave={handleSave}
                    />
                </Sheet>

                <SystemUserTable 
                    users={filteredUsers}
                    recrawlingIds={recrawlingIds}
                    onRecrawl={handleRecrawl}
                    onDelete={setDeletingUser}
                    onEdit={handleEditStart}
                />

                <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                    <EditUserSheet 
                        editingUser={editingUser}
                        setEditingUser={setEditingUser}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        saving={saving}
                        handleEditSave={handleEditSave}
                    />
                </Sheet>

                <DeleteUserDialog 
                    deletingUser={deletingUser}
                    setDeletingUser={setDeletingUser}
                    saving={saving}
                    confirmDelete={confirmDelete}
                />
            </CardContent>
        </Card>
    )
}

"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { facebookService } from "@/services/facebook.service"
import PageEditModal from "./PageEditModal"
import { useAssetExplorer } from "@/hooks/useAssetExplorer"
import { AssetExplorerHeader } from "./components/AssetExplorerHeader"
import { SystemUserMode } from "./components/SystemUserMode"
import { AccountUserMode } from "./components/AccountUserMode"

type Props = { adminPassword: string; isAdminVerified: boolean }

export default function AssetExplorer({ adminPassword, isAdminVerified }: Props) {
  const {
    mode, setMode,
    loading, setLoading,
    systemUsers, loadSystemUsers,
    businessRows,
    standalonePages,
    activeViewerToken,
    activeViewerId,
    manualToken, setManualToken,
    selectedPageIds, setSelectedPageIds,
    isEditModalOpen, setIsEditModalOpen,
    editingPage, setEditingPage,
    handleFetchAssets,
    handleManualSync,
    handleCopyUserToken,
    selectedBmFilter, setSelectedBmFilter,
    selectedSystemAdminId, setSelectedSystemAdminId,
    bmFilterOptions,
    filteredSystemUsers,
    activeSystemUser,
    availableAdmins,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    selectedBusiness,
    openBusinessDetail
  } = useAssetExplorer(adminPassword, isAdminVerified)

  const handleDeleteSelected = async () => {
    if (!selectedSystemAdminId) {
        toast.error("Please select a System Admin first")
        return
    }
    if (confirm(`Remove permissions for ${selectedPageIds.length} pages from this user?`)) {
        try {
            setLoading(true)
            const admin = systemUsers.find(u => u.id === selectedSystemAdminId)
            if (!admin?.token) throw new Error("Admin token not found")
            
            const result = await facebookService.removeSystemUserFromPagesByPageAssignedUsersBatch(
                selectedPageIds,
                activeViewerId,
                admin.token
            )
            
            if (result.successPageIds.length > 0) {
                toast.success(`Removed ${result.successPageIds.length} permissions`)
                const user = systemUsers.find(u => u.id === activeViewerId)
                if (user) await handleFetchAssets(user.token || "", user.id)
            }
            if (result.failed.length > 0) {
                toast.error(`Failed to remove ${result.failed.length} permissions`)
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Delete failed")
        } finally {
            setLoading(false)
        }
    }
  }

  const handleCopySelected = () => {
    navigator.clipboard.writeText(selectedPageIds.join("\n"))
    toast.success("Page IDs copied to clipboard")
  }

  return (
    <div className="flex flex-col gap-6 w-full transition-all">
      <div className="w-full space-y-6">
        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden border-t-primary/20">
          <AssetExplorerHeader 
            mode={mode}
            setMode={setMode}
            systemUsers={systemUsers}
          />

          <CardContent className="p-6">
            {mode === "system-user" ? (
              <SystemUserMode
                loading={loading}
                systemUsers={systemUsers}
                standalonePages={standalonePages}
                selectedBmFilter={selectedBmFilter}
                setSelectedBmFilter={setSelectedBmFilter}
                activeViewerId={activeViewerId}
                activeViewerToken={activeViewerToken}
                selectedSystemAdminId={selectedSystemAdminId}
                setSelectedSystemAdminId={setSelectedSystemAdminId}
                selectedPageIds={selectedPageIds}
                setSelectedPageIds={setSelectedPageIds}
                handleFetchAssets={handleFetchAssets}
                handleCopyUserToken={handleCopyUserToken}
                loadSystemUsers={loadSystemUsers}
                adminPassword={adminPassword}
                availableAdmins={availableAdmins}
                filteredSystemUsers={filteredSystemUsers}
                bmFilterOptions={bmFilterOptions}
                activeSystemUser={activeSystemUser}
                setEditingPage={setEditingPage}
                setIsEditModalOpen={setIsEditModalOpen}
                handleDeleteSelected={handleDeleteSelected}
                handleCopySelected={handleCopySelected}
              />
            ) : (
              <AccountUserMode
                loading={loading}
                manualToken={manualToken}
                setManualToken={setManualToken}
                handleManualSync={handleManualSync}
                businessRows={businessRows}
                standalonePages={standalonePages}
                isDetailSheetOpen={isDetailSheetOpen}
                setIsDetailSheetOpen={setIsDetailSheetOpen}
                selectedBusiness={selectedBusiness}
                openBusinessDetail={openBusinessDetail}
              />
            )}
          </CardContent>
        </Card>
      </div>


      <PageEditModal 
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingPage(null)
        }}
        page={editingPage}
        onSuccess={() => {
          if (activeViewerToken && activeViewerId) {
            void handleFetchAssets(activeViewerToken, activeViewerId)
          }
        }}
        adminToken={selectedSystemAdminId && systemUsers.find(u => u.id === selectedSystemAdminId)?.token || activeViewerToken}
      />
    </div>
  )
}

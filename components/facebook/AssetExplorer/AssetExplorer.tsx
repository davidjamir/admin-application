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
    systemUserPages,
    activeSystemUserToken,
    activeSystemUserId,
    activeAccountUserToken,
    // activeAccountUserId,
    manualToken, setManualToken,
    selectedPageIds, setSelectedPageIds,
    isEditModalOpen, setIsEditModalOpen,
    editingPage, setEditingPage,
    currentUser,
    fetchSystemUserAssets,
    // fetchAccountUserAssets,
    handleManualSync,
    handleCopyUserToken,
    selectedBmFilter, setSelectedBmFilter,
    selectedSystemAdminId, setSelectedSystemAdminId,
    bmFilterOptions,
    filteredSystemUsers,
    availableAdmins,
    isDetailSheetOpen,
    setIsDetailSheetOpen,
    selectedBusiness,
    openBusinessDetail,
    activeSystemUser,
    handleRecrawlBusiness,
    recrawlingIds,
    lastSyncTime
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
                activeSystemUserId,
                admin.token
            )
            
            if (result.successPageIds.length > 0) {
                toast.success(`Removed ${result.successPageIds.length} permissions`)
                const user = systemUsers.find(u => u.id === activeSystemUserId)
                if (user) await fetchSystemUserAssets(user.token || "", user.id)
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
                systemUserPages={systemUserPages}
                selectedBmFilter={selectedBmFilter}
                setSelectedBmFilter={setSelectedBmFilter}
                selectedSystemAdminId={selectedSystemAdminId}
                setSelectedSystemAdminId={setSelectedSystemAdminId}
                selectedPageIds={selectedPageIds}
                setSelectedPageIds={setSelectedPageIds}
                handleFetchAssets={fetchSystemUserAssets}
                handleCopyUserToken={() => handleCopyUserToken(activeSystemUserToken)}
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
                activeViewerId={activeSystemUserId}
                activeViewerToken={activeSystemUserToken}
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
                activeAccountUserToken={activeAccountUserToken}
                setEditingPage={setEditingPage}
                setIsEditModalOpen={setIsEditModalOpen}
                systemUsers={systemUsers}
                currentUser={currentUser}
                lastSyncTime={lastSyncTime}
                handleRecrawlBusiness={handleRecrawlBusiness}
                recrawlingIds={recrawlingIds}
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
          // No refresh needed for basic info updates
        }}
        adminToken={selectedSystemAdminId && systemUsers.find(u => u.id === selectedSystemAdminId)?.token || (mode === "system-user" ? activeSystemUserToken : activeAccountUserToken)}
      />
    </div>
  )
}

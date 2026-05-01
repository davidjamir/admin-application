"use client"

import { useFacebookPages } from "@/hooks/useFacebookPages"
import { PageHeader } from "./components/PageHeader"
import { PageStats } from "./components/PageStats"
import { PageGrid } from "./components/PageGrid"
import { PageDetailSheet } from "./components/PageDetailSheet"
import { LoadingScreen } from "@/components/ui/loading-screen"

export default function PagesManagementPage() {
  const {
    data, totalPages, appliedCategoryFilter, appliedSearchQuery,
    loading, categoryFilter, setCategoryFilter,
    availableCategories, searchQuery, setSearchQuery, fetchedAt,
    selectedPage, setSelectedPage, details, setDetails, detailsLoading,
    activeTab, setActiveTab, showToken, setShowToken,
    handleRefresh, handlePageClick, handleDeletePage, formatExactRelative, getHealthColor, getLatestScheduledAt
  } = useFacebookPages()

  // Only show full screen loading for the very first load when there's no data yet
  if (loading && data.length === 0 && !searchQuery && categoryFilter === "All") {
    return <LoadingScreen />
  }

  return (
    <div className="flex flex-col gap-6 relative min-h-[600px]">
      <PageHeader 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        availableCategories={availableCategories}
      />

      <PageStats 
        fetchedAt={fetchedAt}
        handleRefresh={handleRefresh}
        pageCount={totalPages}
        categoryFilter={appliedCategoryFilter}
        searchQuery={appliedSearchQuery}
      />

      <PageGrid 
        data={data}
        loading={loading}
        selectedPageId={selectedPage?._id.$oid}
        handlePageClick={handlePageClick}
        handleDeletePage={handleDeletePage}
        getHealthColor={getHealthColor}
        formatExactRelative={formatExactRelative}
        getLatestScheduledAt={getLatestScheduledAt}
      />

      {selectedPage && (
        <PageDetailSheet 
          selectedPage={selectedPage}
          onClose={() => setSelectedPage(null)}
          details={details}
          detailsLoading={detailsLoading}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showToken={showToken}
          setShowToken={setShowToken}
          getHealthColor={getHealthColor}
          getLatestScheduledAt={getLatestScheduledAt}
          setDetails={setDetails}
          onDelete={handleDeletePage}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  )
}

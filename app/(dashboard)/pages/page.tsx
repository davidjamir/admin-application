"use client"

import { useFacebookPages } from "@/hooks/useFacebookPages"
import { PageHeader } from "./components/PageHeader"
import { PageStats } from "./components/PageStats"
import { PageGrid } from "./components/PageGrid"
import { PageDetailSheet } from "./components/PageDetailSheet"

export default function PagesManagementPage() {
  const {
    data, loading, categoryFilter, setCategoryFilter,
    availableCategories, searchQuery, setSearchQuery, fetchedAt,
    selectedPage, setSelectedPage, details, setDetails, detailsLoading,
    activeTab, setActiveTab, showToken, setShowToken,
    handleRefresh, handlePageClick, formatExactRelative, getHealthColor
  } = useFacebookPages()

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
        loading={loading}
      />

      <PageGrid 
        loading={loading}
        data={data}
        selectedPageId={selectedPage?._id.$oid}
        handlePageClick={handlePageClick}
        getHealthColor={getHealthColor}
        formatExactRelative={formatExactRelative}
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
          setDetails={setDetails}
        />
      )}
    </div>
  )
}

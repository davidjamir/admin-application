"use client"

import { useAdCreatives } from "@/hooks/useAdCreatives"
import { AdCreativeHeader } from "./components/AdCreativeHeader"
import { AdCreativeStats } from "./components/AdCreativeStats"
import { AdCreativeFilters } from "./components/AdCreativeFilters"
import { AdCreativeTable } from "./components/AdCreativeTable"
import { AdCreativeDetailPanel } from "./components/AdCreativeDetailPanel"
import { AdCreativeAddPanel } from "./components/AdCreativeAddPanel"

export default function AdCreativesPage() {
  const {
    items, loading, fetchedAt, websiteOrigins,
    search, setSearch, sourceFilter, setSourceFilter,
    domainFilter, setDomainFilter, enabledFilter, setEnabledFilter,
    sortKey, sortDir, handleSort,
    selected, setSelected, editing, setEditing, editForm, setEditForm, saving,
    addOpen, setAddOpen, form, setForm, submitting,
    sources, domainsInUI, sorted,
    fetchData, handlePageSave, handleAddSubmit, handleDelete
  } = useAdCreatives()

  const panelOpen = !!selected || addOpen

  if (!loading && items.length === 0 && !search && sourceFilter === "all" && domainFilter === "all") {
    // Initial empty state or loading handled inside components
  }

  return (
    <div className="flex gap-0 h-full relative min-h-[600px]">
      <div className="p-6 flex flex-col gap-10 flex-1 min-w-0">
        <AdCreativeHeader 
          fetchedAt={fetchedAt}
          fetchData={fetchData}
          onAddOpen={() => { setSelected(null); setAddOpen(true) }}
        />

        <AdCreativeStats items={items} loading={loading} />

        <AdCreativeFilters 
          search={search}
          setSearch={setSearch}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          domainFilter={domainFilter}
          setDomainFilter={setDomainFilter}
          enabledFilter={enabledFilter}
          setEnabledFilter={setEnabledFilter}
          sources={sources}
          domainsInUI={domainsInUI}
        />

        <AdCreativeTable 
          loading={loading}
          sorted={sorted}
          selectedId={selected?._id}
          sortKey={sortKey}
          sortDir={sortDir}
          handleSort={handleSort}
          onOpenDetail={(item) => {
            setSelected(item)
            setEditing(false)
            setEditForm(null)
            setAddOpen(false)
          }}
          totalCount={items.length}
        />
      </div>

      {panelOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/50 backdrop-blur-[2px] animate-in fade-in"
          onClick={() => { setSelected(null); setAddOpen(false); setEditing(false) }}
        />
      )}

      {selected && !addOpen && (
        <AdCreativeDetailPanel 
          selected={selected}
          editing={editing}
          editForm={editForm}
          setEditForm={setEditForm}
          saving={saving}
          onClose={() => { setSelected(null); setEditing(false) }}
          onStartEdit={() => {
            if (!selected) return
            setEditForm({ ...selected })
            setEditing(true)
          }}
          onCancelEdit={() => {
            setEditing(false)
            setEditForm(null)
          }}
          onSaveEdit={handlePageSave}
          onDelete={handleDelete}
          websiteOrigins={websiteOrigins}
        />
      )}

      {addOpen && (
        <AdCreativeAddPanel 
          onClose={() => setAddOpen(false)}
          form={form}
          setForm={setForm}
          submitting={submitting}
          onSubmit={handleAddSubmit}
          websiteOrigins={websiteOrigins}
        />
      )}

      <datalist id="origins-list">
        {websiteOrigins.map(o => <option key={o} value={o} />)}
      </datalist>
    </div>
  )
}

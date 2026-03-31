import React from "react"
import { LayoutGrid } from "lucide-react"
import { Card } from "@/components/ui/card"
import { PageGridProps } from "./types"
import { PageCard } from "./PageCard"

export const PageGrid: React.FC<PageGridProps> = ({
  data, selectedPageId, handlePageClick, getHealthColor, formatExactRelative
}) => {
  if (data.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 bg-muted/20 border-dashed">
        <LayoutGrid className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
        <h3 className="text-xl font-semibold">No pages found</h3>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
      {data.map((page) => (
        <PageCard 
          key={page._id.$oid}
          page={page}
          isSelected={selectedPageId === page._id.$oid}
          onClick={() => handlePageClick(page)}
          getHealthColor={getHealthColor}
          formatExactRelative={formatExactRelative}
        />
      ))}
    </div>
  )
}

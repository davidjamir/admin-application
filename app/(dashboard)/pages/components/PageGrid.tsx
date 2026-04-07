import React from "react"
import { LayoutGrid } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageGridProps } from "./types"
import { PageCard } from "./PageCard"

const PageSkeleton = () => (
  <Card className="relative overflow-hidden border flex flex-col transition-all bg-card min-h-[180px] shadow-sm animate-pulse">
    <div className="absolute top-0 left-0 right-0 h-1 bg-muted" />
    <CardHeader className="pb-1 pt-4 px-5 flex flex-row items-start justify-between space-y-0">
      <div className="flex flex-col w-[85%] gap-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="size-2.5 rounded-full" />
    </CardHeader>
    <CardContent className="flex-1 px-5 pt-3 pb-3 flex flex-col justify-end gap-3">
      <div className="flex justify-between items-center w-full">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <div className="flex justify-between items-center w-full mt-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </CardContent>
    <CardFooter className="px-5 py-2.5 bg-muted/30 border-t flex flex-col gap-1.5">
      <div className="flex w-full justify-between items-center pt-0.5">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </CardFooter>
  </Card>
)

export const PageGrid: React.FC<PageGridProps> = ({
  data, loading, selectedPageId, handlePageClick, getHealthColor, formatExactRelative
}) => {
  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {[...Array(6)].map((_, i) => (
          <PageSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-20 bg-muted/20 border-dashed">
        <LayoutGrid className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
        <h3 className="text-xl font-semibold text-black">No pages found</h3>
        <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or search query.</p>
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

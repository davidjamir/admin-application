import React from "react"
import { LayoutGrid } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { PageGridProps } from "./types"
import { PageCard } from "./PageCard"

export const PageGrid: React.FC<PageGridProps> = ({
  loading, data, selectedPageId, handlePageClick, getHealthColor, formatExactRelative
}) => {
  if (loading) {
    return (
      <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="flex flex-col h-[200px]">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-[120px]" />
            </CardHeader>
            <CardContent className="flex-1">
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-4/5" />
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Skeleton className="h-5 w-[60px] rounded-full" />
              <Skeleton className="h-4 w-[80px]" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

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

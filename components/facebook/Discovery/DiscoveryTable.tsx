import { Layers } from "lucide-react"
import { LoadingScreen } from "@/components/ui/loading-screen"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { DiscoveryTableProps } from "./types"
import { DiscoveryTableRow } from "./DiscoveryTableRow"

export const DiscoveryTable: React.FC<DiscoveryTableProps> = ({
  loadingPages, pages, selectedPageIds, setSelectedPageIds, handleCopy
}) => {
  const isAllSelected = pages.length > 0 && pages.every((p) => selectedPageIds.includes(p.id))

  return (
    <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow className="hover:bg-transparent border-border/50">
            <TableHead className="w-12 text-center py-3">
              <Checkbox 
                checked={isAllSelected}
                onCheckedChange={(checked) => {
                  if (checked) setSelectedPageIds(pages.map(p => p.id))
                  else setSelectedPageIds([])
                }}
                disabled={pages.length === 0}
                className="border-border/60 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </TableHead>
            <TableHead className="text-left text-xs uppercase font-extrabold tracking-wider text-black">Page Identity</TableHead>
            <TableHead className="text-left text-xs uppercase font-extrabold tracking-wider text-black">Category</TableHead>
            <TableHead className="text-left text-xs uppercase font-extrabold tracking-wider text-black">Topic</TableHead>
            <TableHead className="text-left text-xs uppercase font-extrabold tracking-wider text-black">Token Health</TableHead>
            <TableHead className="text-right text-xs uppercase font-extrabold tracking-wider pr-6 text-black">Operations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loadingPages ? (
            <TableRow>
              <TableCell colSpan={6} className="py-0 text-center border-none">
                <LoadingScreen fullScreen={false} />
              </TableCell>
            </TableRow>
          ) : pages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3 opacity-30">
                  <Layers className="w-10 h-10 text-black" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-black">Discovery Required</p>
                    <p className="text-[10px] text-muted-foreground">Select an active identity to crawl linked page assets.</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            pages.map((page) => (
              <DiscoveryTableRow 
                key={page.id}
                page={page}
                isSelected={selectedPageIds.includes(page.id)}
                onToggle={() => {
                  const isChecked = selectedPageIds.includes(page.id)
                  setSelectedPageIds(prev => isChecked ? prev.filter(id => id !== page.id) : [...prev, page.id])
                }}
                handleCopy={handleCopy}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

import React, { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Facebook } from "lucide-react"
import { toast } from "sonner"
import { PageCardProps } from "./types"

export const PageCard: React.FC<PageCardProps> = ({
  page, isSelected, onClick, getHealthColor, formatExactRelative
}) => {
  const healthColor = getHealthColor(page.lastScheduledAt)
  const [isIdHovered, setIsIdHovered] = useState(false)

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(page.pageId)
    toast.success(`Page ID: ${page.pageId} copied!`)
  }
  
  return (
    <Card 
      className={`relative overflow-hidden border cursor-pointer flex flex-col transition-all bg-card min-h-[180px] group ${isSelected ? 'ring-2 ring-primary ring-offset-1 shadow-md' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}
      onClick={onClick}
      style={{ 
        borderTop: `4px solid ${healthColor}`,
        borderColor: healthColor.replace('hsl', 'hsla').replace(')', ', 0.3)')
      }}
    >
      <CardHeader className="pb-1 pt-4 px-5 flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col w-[85%]">
          <div className="h-[42px] flex items-start">
            <span className="font-semibold text-[15px] leading-snug break-words line-clamp-2 text-black">
              {page.name}
              <a
                href={`https://facebook.com/${page.pageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group/fb inline-flex items-center justify-center size-5 ml-1.5 align-middle cursor-pointer border border-transparent hover:border-[#1877F2]/30 rounded-sm bg-transparent hover:bg-[#1877F2]/10 transition-all"
                onClick={(e) => e.stopPropagation()}
                title="View on Facebook"
              >
                <Facebook className="size-2.5 text-[#1877F2]" />
              </a>
            </span>
          </div>
        </div>
        <div className="size-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
      </CardHeader>
      
      <CardContent className="flex-1 px-5 pt-3 pb-3 flex flex-col justify-end">
        <div className="text-xs flex items-center justify-between w-full mb-1">
          <span 
            className="font-medium"
            style={{ color: healthColor }}
          >
            Scheduled: {page.queueCount || 0}
          </span>
          <div className="flex items-center gap-3">
            <div 
              className="group/id flex items-center gap-1.5 cursor-pointer transition-colors"
              onClick={handleCopyId}
              onMouseEnter={() => setIsIdHovered(true)}
              onMouseLeave={() => setIsIdHovered(false)}
              style={{ color: isIdHovered ? healthColor : undefined }}
            >
              <span className="text-[10px] text-muted-foreground group-hover/id:text-inherit">
                ID: <span className="font-medium text-foreground group-hover/id:text-inherit">{page.pageId}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-[12.5px] font-medium leading-snug tracking-tight text-left" style={{ color: healthColor }}>
            {formatExactRelative(page.lastScheduledAt)}
          </div>
          <span className="text-[10px] text-muted-foreground">
            Admin: <span className="font-medium text-foreground">{page.systemUserName || "System"}</span>
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="px-5 py-2.5 bg-muted/30 border-t flex flex-col gap-1.5 text-[11px] text-muted-foreground">
        <div className="flex w-full justify-between items-center pt-0.5">
          {page.topic ? (
            <span className="font-bold text-primary tracking-tight">{page.topic}</span>
          ) : (
            <span className="font-medium text-foreground opacity-0">—</span>
          )}
          <span className="flex items-center gap-1">Last scheduled: <span className="font-semibold text-foreground">{
             !page.lastScheduledAt || page.lastScheduledAt < 0 
               ? "Chưa có lịch" 
               : new Intl.DateTimeFormat("en-GB", {
                   timeZone: "Asia/Ho_Chi_Minh",
                   hour: "2-digit",
                   minute: "2-digit",
                   day: "2-digit",
                   month: "2-digit",
                   year: "numeric"
                 }).format(new Date(page.lastScheduledAt)).replace(',', '')
           }</span></span>
        </div>
      </CardFooter>
    </Card>
  )
}

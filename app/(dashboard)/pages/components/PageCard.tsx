import React, { useState } from "react"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Facebook, MessageSquare } from "lucide-react"
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
      className={`relative overflow-hidden border cursor-pointer flex flex-col transition-all bg-card min-h-[160px] group ${isSelected ? 'ring-2 ring-primary ring-offset-1 shadow-md' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}
      onClick={onClick}
      style={{ 
        borderTop: `4px solid ${healthColor}`,
        borderColor: healthColor.replace('hsl', 'hsla').replace(')', ', 0.3)')
      }}
    >
      <CardHeader className="pb-0.5 pt-2.5 px-5 flex flex-row items-start justify-between space-y-0">
        <div className="flex flex-col w-[85%]">
          <div className="h-[42px] flex items-start">
            <span className="font-semibold text-[15px] leading-snug break-words line-clamp-2 text-black">
              {page.name}
              <span className="inline-flex items-center gap-1 ml-2 flex-shrink-0 align-middle">
                <a
                  href={`https://facebook.com/${page.pageId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-5 inline-flex items-center justify-center rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2]/20 transition-all"
                  onClick={(e) => e.stopPropagation()}
                  title="View on Facebook"
                >
                  <Facebook className="size-2.5 text-[#1877F2]" />
                </a>
                <a
                  href={`https://www.facebook.com/profile.php?id=${page.pageId}&sk=reviews`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="size-5 inline-flex items-center justify-center rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 transition-all font-bold"
                  onClick={(e) => e.stopPropagation()}
                  title="View Reviews"
                >
                  <MessageSquare className="size-2.5 text-indigo-500" />
                </a>
              </span>
            </span>
          </div>
        </div>
        <div className="size-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: healthColor, boxShadow: `0 0 6px ${healthColor}` }} />
      </CardHeader>
      
      <CardContent className="flex-1 px-5 pt-1 pb-1 flex flex-col justify-end">
        <div className="text-xs flex items-center justify-between w-full mb-0.5">
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
        <div className="flex items-center justify-between mt-1">
          <div className="text-[12px] font-medium leading-snug tracking-tight text-left" style={{ color: healthColor }}>
            {formatExactRelative(page.lastScheduledAt)}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[9px] text-muted-foreground">
              Admin: <span className="font-medium text-foreground">{page.systemUserName || "System"}</span>
            </span>
            <div className="flex items-center gap-2 text-[9px] font-bold opacity-70">
              <span className="flex items-center gap-1">T: <span className="text-foreground">{page.trafficInterval || 0}m</span></span>
              <span className="flex items-center gap-1">V: <span className="text-foreground">{page.viralInterval || 0}m</span></span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-5 py-1.5 bg-muted/30 border-t flex flex-col gap-1 text-[10px] text-muted-foreground">
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

"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export const Section = ({ title, icon: Icon, children, count }: { title: string; icon: React.ElementType; children: React.ReactNode; count?: number }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between border-b border-border/50 pb-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary/70" />
        <h4 className="text-sm font-normal tracking-tight">{title}</h4>
      </div>
      {count !== undefined && (
        <Badge variant="secondary" className="text-[10px] font-normal h-5">
          {count}
        </Badge>
      )}
    </div>
    <div className="grid gap-0">
      {children}
    </div>
  </div>
)

export const DetailContainer = ({
  children,
  detailContent,
  isOpen,
  onClose,
  width = "2/3"
}: {
  children: React.ReactNode;
  detailContent: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  width?: string;
}) => (
  <div className="flex h-full overflow-hidden">
    <div className={cn(
      "p-6 space-y-8 overflow-y-auto custom-scrollbar transition-all duration-300",
      isOpen ? (width === "2/3" ? "w-1/3" : "w-1/2") : "w-full"
    )}>
      {children}
    </div>
    {isOpen && (
      <div className={cn(
        "border-l border-border/50 bg-muted/5 flex flex-col overflow-hidden animate-in slide-in-from-right-4 duration-300",
        width === "2/3" ? "w-2/3" : "w-1/2"
      )}>
        <div className="relative flex-1 overflow-hidden">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="h-full p-6 overflow-y-auto custom-scrollbar space-y-8">
            {detailContent}
          </div>
        </div>
      </div>
    )}
  </div>
)

export const Item = ({
  label,
  value,
  subValue,
  extraSubValue,
  status,
  isID,
  isSelected,
  onClick,
  imageUrl
}: {
  label: React.ReactNode;
  value: string;
  subValue?: string;
  extraSubValue?: string;
  status?: string;
  isID?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
  imageUrl?: string
}) => {
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(value)
    toast.success("ID Copied")
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between py-1.5 px-2 rounded-xl border transition-all duration-200 cursor-pointer",
        isSelected
          ? "bg-primary/10 border-primary/30 shadow-sm"
          : "bg-card hover:bg-muted/50 border-border/50 hover:border-primary/20 hover:shadow-sm"
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden w-full">
        {imageUrl && (
          <div className="w-5 h-5 rounded-lg overflow-hidden border border-border/50 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={typeof label === 'string' ? label : 'Avatar'} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="space-y-0.5 overflow-hidden flex-1">
          <p className={cn(
            "text-xs font-semibold truncate",
            isSelected ? "text-primary" : "text-foreground"
          )}>{label}</p>
          
          <div className="flex flex-col gap-0.5">
            {isID && (
              <span
                onClick={handleCopy}
                className="text-[9px] text-muted-foreground font-mono transition-colors cursor-pointer hover:text-primary hover:bg-primary/5 px-1 rounded -ml-1 w-fit truncate"
                title="Click to copy ID"
              >
                ID: {value}
              </span>
            )}
            {!isID && (
              <span className="text-[10px] text-muted-foreground/70 truncate">{value}</span>
            )}
            
            {(subValue || extraSubValue) && (
              <div className="flex flex-col gap-0.5">
                {subValue && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {subValue}
                  </span>
                )}
                {extraSubValue && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {extraSubValue}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {status && (
          <Badge
            variant={status === "Active" || status === "1" || status === "Current User" ? "outline" : "secondary"}
            className={cn(
              "text-[8px] h-4 font-normal capitalize",
              (status === "Active" || status === "1" || status === "Current User") && "bg-green-600/10 text-green-600 border-green-600/20"
            )}
          >
            {(status === "1" ? "active" : status || "").toLowerCase()}
          </Badge>
        )}
      </div>
    </div>
  )
}

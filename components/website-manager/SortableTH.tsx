import React from "react"
import { SortableTHProps } from "./types"

export const SortableTH: React.FC<SortableTHProps> = ({ label, col, sort, align = "left", className = "" }) => {
    const { toggle, Icon } = sort
    const alignmentClasses = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left"
    const justifyClasses = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start"

    return (
        <th
            onClick={() => toggle(col)}
            className={`px-4 py-4 cursor-pointer hover:bg-muted/60 transition-colors group text-black ${alignmentClasses} font-bold text-sm ${className}`}
        >
            <div className={`flex items-center gap-1.5 ${justifyClasses}`}>
                {label}
                <div className="transition-transform group-hover:scale-110">
                    <Icon col={col} />
                </div>
            </div>
        </th>
    )
}

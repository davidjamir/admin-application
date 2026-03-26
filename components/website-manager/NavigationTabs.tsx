import React from "react"
import { NavigationTabsProps } from "./types"

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ tab, setTab, setSearch, counts, loading }) => {
    const tabs = [
        { key: "blogs", label: "Blogs" },
        { key: "wraps", label: "Wraps" },
        { key: "quotas", label: "Quotas" }
    ] as const

    return (
        <div className="flex border-b border-border/40 gap-1 mt-6">
            {tabs.map(({ key, label }) => (
                <button 
                    key={key} 
                    onClick={() => { setTab(key); setSearch("") }}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                    {label}
                    <span className="ml-2 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                        {loading ? "…" : counts[key]}
                    </span>
                </button>
            ))}
        </div>
    )
}

import React from "react"
import { Globe, Clock, RefreshCcw } from "lucide-react"
import { toast } from "sonner"
import { WebsiteHeaderProps } from "./types"

const fmtDate = (ms: number) =>
  new Date(ms).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })

export const WebsiteHeader: React.FC<WebsiteHeaderProps> = ({ fetchedAt, onRefresh, refreshing, fetchData }) => {
    return (
        <div className="flex items-start justify-between">
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold">Websites Manager</h1>
                </div>
                {fetchedAt && (
                    <p className="text-xs text-muted-foreground ml-[52px] italic flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        Cached Sync: {fmtDate(fetchedAt)}
                        <button 
                            disabled={refreshing}
                            onClick={async () => { 
                                const id = toast.loading("Recrawling..."); 
                                await fetchData(true); 
                                toast.success("Refreshed", { id }) 
                            }} 
                            className={`cursor-pointer transition-colors ${refreshing ? "text-green-600" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <RefreshCcw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
                        </button>
                    </p>
                )}
            </div>
            <button 
                onClick={onRefresh}
                disabled={refreshing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors text-sm font-medium cursor-pointer disabled:opacity-50 ${refreshing ? "border-green-600 text-green-600 bg-green-50/50" : "bg-card hover:bg-muted"}`}
            >
                <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin text-green-600" : ""}`} /> Refresh
            </button>
        </div>
    )
}

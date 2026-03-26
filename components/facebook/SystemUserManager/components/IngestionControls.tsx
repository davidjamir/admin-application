import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCcw, UserPlus } from "lucide-react"
import { IngestionControlsProps } from "./types"

export const IngestionControls: React.FC<IngestionControlsProps> = ({
    crawlToken, setCrawlToken, handleCrawl, crawling
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 group-hover:text-primary/50 transition-colors">
                    <UserPlus className="w-4 h-4" />
                </div>
                <Input 
                    value={crawlToken}
                    onChange={(e) => setCrawlToken(e.target.value)}
                    placeholder="Connect new identity token (EAAG...)"
                    className="pl-9 h-11 bg-background/50 border-border/50 focus:ring-primary/20"
                />
            </div>
            <Button 
                onClick={handleCrawl} 
                disabled={crawling || !crawlToken.trim()}
                className={`h-11 cursor-pointer font-bold shadow-lg shadow-primary/5 ${crawling ? "border-green-600/50 bg-green-600/5 shadow-[0_0_15px_rgba(22,163,74,0.2)]" : ""}`}
            >
                {crawling ? <Loader2 className="w-4 h-4 animate-spin mr-2 text-green-600 drop-shadow-[0_0_8px_rgba(22,163,74,0.8)]" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
                {crawling ? "Establishing..." : "Sync Identity"}
            </Button>
        </div>
    )
}

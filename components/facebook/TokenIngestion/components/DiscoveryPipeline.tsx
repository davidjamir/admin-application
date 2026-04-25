import React from "react"
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Briefcase, Database, Loader2, RefreshCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { DiscoveryPipelineProps } from "./types"

export const DiscoveryPipeline: React.FC<DiscoveryPipelineProps> = ({
    selectedBmFilter, setSelectedBmFilter, bmFilterOptions,
    selectedSystemUserId, setSelectedSystemUserId, filteredSystemUsers,
    loadingPages, saving, isAdminVerified, pages, selectedPageIds, handlePageSave,
    customTopic, setCustomTopic,
    trafficInterval, setTrafficInterval,
    viralInterval, setViralInterval,
    availableTopics
}) => {
    return (
        <div className="space-y-4">
            {/* Row 1: Selectors */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex flex-col md:flex-row items-center gap-2 w-full">
                    <div className="w-full md:w-72 shrink-0">
                        <Select value={selectedBmFilter} onValueChange={(v) => {
                            setSelectedBmFilter(v)
                            setSelectedSystemUserId("") // Reset user on BM change
                        }} disabled={loadingPages || bmFilterOptions.length === 0}>
                            <SelectTrigger className="!h-12 w-full bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium text-sm rounded-xl">
                                <SelectValue placeholder="All Business" />
                            </SelectTrigger>
                            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 w-[var(--radix-select-trigger-width)] max-h-[300px]">
                                <SelectItem value="all" className="font-semibold text-sm py-2.5 cursor-pointer">All Business</SelectItem>
                                {bmFilterOptions.map((bm) => (
                                    <SelectItem key={bm.id} value={bm.id} className="text-sm py-2.5 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4 opacity-50 text-sky-500" />
                                            <span className="truncate">{bm.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-full md:flex-1">
                        <Select
                            value={selectedSystemUserId}
                            onValueChange={setSelectedSystemUserId}
                            disabled={loadingPages || filteredSystemUsers.length === 0}
                        >
                            <SelectTrigger className="!h-12 w-full bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium text-sm rounded-xl">
                                <SelectValue placeholder="Select System User" />
                            </SelectTrigger>
                            <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 w-[var(--radix-select-trigger-width)] max-h-[300px]">
                                {filteredSystemUsers.map((user) => (
                                    <SelectItem key={user.id} value={user.id} className="text-sm py-2.5 cursor-pointer">
                                        <span className="truncate">
                                            {user.name} • {user.appName || "Standard"} • {user.id}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        disabled={!selectedSystemUserId || loadingPages}
                        onClick={() => {
                            setSelectedSystemUserId("")
                            setTimeout(() => setSelectedSystemUserId(selectedSystemUserId), 10)
                        }}
                        className={cn(
                            "!h-12 !w-12 shrink-0 rounded-xl transition-all group border",
                            loadingPages
                                ? "border-green-600 text-green-600"
                                : "border-border/50 hover:border-green-600 text-muted-foreground hover:text-green-600 cursor-pointer"
                        )}
                    >
                        <RefreshCcw className={cn("w-4 h-4 transition-colors", !loadingPages && "opacity-50 group-hover:opacity-100", loadingPages && "animate-spin text-green-600")} />
                    </Button>

                    <Button
                        onClick={handlePageSave}
                        disabled={!isAdminVerified || saving || loadingPages || (pages.length > 0 && selectedPageIds.length === 0)}
                        className={cn(
                            "!h-12 px-8 font-bold transition-all rounded-xl shadow-sm border text-sm shrink-0",
                            (pages.length > 0 && selectedPageIds.length > 0)
                                ? "bg-blue-500 border-blue-500 text-white shadow-md hover:bg-blue-600 cursor-pointer"
                                : (pages.length > 0)
                                    ? "bg-white border-blue-50 text-black border-2"
                                    : "bg-white text-gray-400",
                            "disabled:opacity-90 disabled:cursor-not-allowed"
                        )}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2 text-green-600" /> : <Database className="w-4 h-4 mr-2" />}
                        {saving ? "Ingesting..." : "Ingest Tokens"}
                    </Button>
                </div>
            </div>

            {/* Row 2: Custom Inputs & Actions (Visible only when system user selected) */}
            {selectedSystemUserId && (
                <div className="flex flex-col md:flex-row items-end gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="w-full md:flex-1">
                        <label className="text-[10px] font-bold text-muted-foreground tracking-widest mb-1.5 block ml-1">Custom Topic</label>
                        <Input
                            placeholder="Optional topic override..."
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            className="!h-12 w-full bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium text-sm rounded-xl"
                            list="topic-suggestions"
                        />
                        <datalist id="topic-suggestions">
                            {availableTopics.map(topic => (
                                <option key={topic} value={topic} />
                            ))}
                        </datalist>
                    </div>

                    <div className="w-full md:w-40">
                        <label className="text-[10px] font-bold text-muted-foreground tracking-widest mb-1.5 block ml-1">Traffic (min)</label>
                        <Input
                            type="number"
                            value={trafficInterval}
                            onChange={(e) => setTrafficInterval(parseInt(e.target.value) || 0)}
                            className="!h-12 w-full bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium text-sm rounded-xl"
                        />
                    </div>

                    <div className="w-full md:w-40">
                        <label className="text-[10px] font-bold text-muted-foreground tracking-widest mb-1.5 block ml-1">Viral (min)</label>
                        <Input
                            type="number"
                            value={viralInterval}
                            onChange={(e) => setViralInterval(parseInt(e.target.value) || 0)}
                            className="!h-12 w-full bg-background/50 border-border/50 hover:border-primary/30 transition-all font-medium text-sm rounded-xl"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

import React from "react"
import { Search, RefreshCcw, UserPlus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { HubFiltersProps } from "./types"

export const HubFilters: React.FC<HubFiltersProps> = ({
    search, setSearch, selectedBmFilter, setSelectedBmFilter, 
    bmFilterOptions, loadingUsers, onRefresh, setIsSheetOpen,
    selectedStatusFilter, setSelectedStatusFilter
}) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2">
            <div className="relative w-full md:w-96 group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or identity ID..."
                    className="pl-10 h-12 text-sm bg-muted/20 border-border/40 focus:bg-background/50 focus:ring-primary/20 transition-all rounded-xl text-black"
                />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <Select
                    value={selectedBmFilter}
                    onValueChange={setSelectedBmFilter}
                    disabled={bmFilterOptions.length === 0}
                >
                    <SelectTrigger className="!h-12 min-w-[240px] px-4 bg-background/50 border-border/50 text-sm font-semibold rounded-xl hover:border-primary/30 transition-all text-black">
                        <SelectValue placeholder={bmFilterOptions.length === 0 ? "No Business Data" : "All Business"} />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-xl w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="all" className="py-2.5 cursor-pointer">All Business</SelectItem>
                        {bmFilterOptions.map((bm) => (
                            <SelectItem key={bm.id} value={bm.id} className="py-2.5 cursor-pointer">{bm.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={selectedStatusFilter}
                    onValueChange={setSelectedStatusFilter}
                    disabled={bmFilterOptions.length === 0}
                >
                    <SelectTrigger className="!h-12 min-w-[160px] px-4 bg-background/50 border-border/50 text-sm font-semibold rounded-xl hover:border-primary/30 transition-all text-black">
                        <SelectValue placeholder={bmFilterOptions.length === 0 ? "No Data" : "All Status"} />
                    </SelectTrigger>
                    <SelectContent className="bg-card/95 backdrop-blur-xl border-border/50 rounded-xl w-[var(--radix-select-trigger-width)]">
                        <SelectItem value="all" className="py-2.5 cursor-pointer text-black">All Status</SelectItem>
                        <SelectItem value="Active" className="py-2.5 cursor-pointer text-black">Active</SelectItem>
                        <SelectItem value="Disabled" className="py-2.5 cursor-pointer text-black">Disabled</SelectItem>
                    </SelectContent>
                </Select>

                <Button
                    variant="outline"
                    size="icon"
                    className={`h-12 w-12 rounded-xl border-border/50 hover:bg-primary/10 hover:text-primary transition-all shrink-0 cursor-pointer ${loadingUsers ? "border-emerald-500/50 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : ""}`}
                    onClick={onRefresh}
                    disabled={loadingUsers}
                >
                    <RefreshCcw className={`w-4 h-4 ${loadingUsers ? "animate-spin text-emerald-500" : "text-black"}`} />
                </Button>

                <Button 
                    onClick={() => setIsSheetOpen(true)}
                    className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all whitespace-nowrap cursor-pointer"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add System User
                </Button>
            </div>
        </div>
    )
}

import React from "react"
import { Users, Activity } from "lucide-react"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HubHeaderProps } from "./types"

export const HubHeader: React.FC<HubHeaderProps> = ({ status }) => {
    return (
        <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                        <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-xl tracking-tight text-black">System User Control Hub</CardTitle>
                        <div className="flex items-center gap-2 mt-0.5">
                            <Activity className="w-3 h-3 text-primary animate-pulse" />
                            <p className="text-[10px] font-medium text-muted-foreground tracking-widest">{status}</p>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono bg-background/50 border-primary/20 text-primary">
                    v3.0 Enterprise
                </Badge>
            </div>
        </CardHeader>
    )
}

import React from "react"
import { Briefcase } from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { SystemUserTableProps } from "./types"
import { SystemUserTableRow } from "./SystemUserTableRow"

export const SystemUserTable: React.FC<SystemUserTableProps> = ({
    users, recrawlingIds, onRecrawl, onDelete, onEdit
}) => {
    return (
        <div className="rounded-2xl border border-border/50 bg-background/50 overflow-hidden shadow-inner">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Asset ID</TableHead>
                        <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Asset Identity</TableHead>
                        <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Status</TableHead>
                        <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Category</TableHead>
                        <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">App</TableHead>
                        <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Update</TableHead>
                        <TableHead className="text-xs font-extrabold text-black tracking-wider py-4 px-6 text-left">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={7} className="py-24 text-center">
                                <div className="flex flex-col items-center gap-4 opacity-20">
                                    <Briefcase className="w-12 h-12" />
                                    <div className="space-y-1">
                                        <p className="text-sm tracking-widest text-black/70">Personnel Registry Offline</p>
                                        <p className="text-[10px] text-muted-foreground/50">Provision a new identity to activate registry.</p>
                                    </div>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <SystemUserTableRow 
                                key={user.id} 
                                user={user} 
                                isRecrawling={recrawlingIds.has(user.id)}
                                onRecrawl={onRecrawl}
                                onDelete={onDelete}
                                onEdit={onEdit}
                            />
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    )
}

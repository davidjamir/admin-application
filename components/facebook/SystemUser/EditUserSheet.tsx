import React from "react"
import { Database, ShieldCheck, Key, Loader2, Check } from "lucide-react"
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { EditUserSheetProps } from "./types"

export const EditUserSheet: React.FC<EditUserSheetProps> = ({
    editingUser, setEditingUser, editForm, setEditForm, saving, handleEditSave
}) => {
    return (
        <SheetContent side="right" className="sm:max-w-[30vw] min-w-[500px] bg-card/95 backdrop-blur-3xl border-l-border/50 shadow-2xl p-0 overflow-hidden">
            <div className="h-full flex flex-col">
                <SheetHeader className="p-8 border-b border-border/50 bg-muted/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-black">
                        <Database className="w-32 h-32 -rotate-12" />
                    </div>
                    <SheetTitle className="flex items-center gap-4 text-3xl">
                        <div className="p-4 bg-blue-500/10 rounded-2xl shadow-inner border border-blue-500/20">
                            <Database className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="flex flex-col text-left text-black">
                            <span className="font-black tracking-tightest">Modify System User</span>
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em] opacity-60">Update identity details</span>
                        </div>
                    </SheetTitle>
                    <SheetDescription className="text-sm mt-4 opacity-70 font-medium text-left">
                        Synchronizing updates for identity: <span className="font-mono text-blue-500 font-black tracking-wider uppercase">{editingUser?.id}</span>
                    </SheetDescription>
                </SheetHeader>
                <div className="px-8 flex flex-col gap-6 py-8 flex-1 overflow-y-auto bg-background/40">
                    <div className="space-y-6">
                        <div className="relative group text-left">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative p-5 bg-card/80 border border-border/40 rounded-2xl space-y-4 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-bold tracking-widest text-muted-foreground/60 uppercase">System User Identify</p>
                                        <h3 className="font-black text-xl text-black tracking-tight">{editingUser?.name}</h3>
                                    </div>
                                    <div className="p-2.5 bg-primary/10 rounded-xl">
                                        <ShieldCheck className="w-5 h-5 text-primary" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border/20">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground/40 tracking-wider uppercase">Business Name</p>
                                        <p className="text-sm font-bold truncate text-black">{editingUser?.businessName || "Unassigned"}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-muted-foreground/40 tracking-wider uppercase">Business ID</p>
                                        <p className="text-xs font-mono font-bold opacity-80 truncate text-blue-500">{editingUser?.businessId || "—"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-5 pt-2 text-left">
                            <div className="space-y-2.5">
                                <div className="flex items-center gap-2 ml-1">
                                    <Key className="w-3.5 h-3.5 text-primary/60" />
                                    <label className="text-xs font-bold tracking-tight text-muted-foreground">Access Token</label>
                                </div>
                                <Input
                                    value={editForm.token}
                                    onChange={(e) => setEditForm({ ...editForm, token: e.target.value })}
                                    className="bg-background/50 border-border/40 font-mono text-xs h-12 focus:ring-1 focus:ring-primary/20 transition-all rounded-xl text-black"
                                    type="password"
                                    placeholder="Enter secure access token..."
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">App Name</label>
                                <Input
                                    value={editForm.appName}
                                    onChange={(e) => setEditForm({ ...editForm, appName: e.target.value })}
                                    className="h-12 bg-background/50 border-border/40 text-black"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Category</label>
                                <Input
                                    value={editForm.category}
                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                    className="h-12 bg-background/50 border-border/40 text-black"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Button 
                            onClick={handleEditSave}
                            disabled={saving}
                            className="w-full h-12 font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all bg-primary hover:bg-primary/90 text-white cursor-pointer"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {saving ? "Synchronizing..." : "Finalize Protocol"}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setEditingUser(null)}
                            className="w-full h-12 border-border/50 text-muted-foreground hover:bg-muted/10 transition-all cursor-pointer"
                        >
                            Discard Changes
                        </Button>
                    </div>
                </div>
            </div>
        </SheetContent>
    )
}

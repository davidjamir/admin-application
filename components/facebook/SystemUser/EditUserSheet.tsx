import React from "react"
import { Database, ShieldCheck, Key, Loader2, Check, Copy, ClipboardPaste } from "lucide-react"
import { toast } from "sonner"
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
                    <SheetTitle className="flex items-center gap-4 text-2xl">
                        <div className="p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-sm">
                            <Database className="w-7 h-7 text-blue-500" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-0.5">System User Profile</span>
                            <span className="font-black text-2xl text-black tracking-tight leading-none truncate max-w-[320px]">{editingUser?.name}</span>
                        </div>
                    </SheetTitle>
                </SheetHeader>
                <div className="px-8 flex flex-col gap-8 py-8 flex-1 overflow-y-auto bg-background/40">
                    <div className="space-y-6">
                        <div className="relative group text-left">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative p-6 bg-card/80 border border-border/40 rounded-2xl space-y-5 shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">Identity Profile</p>
                                        <h3 className="font-black text-2xl text-black tracking-tight">{editingUser?.name}</h3>
                                    </div>
                                    <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                                        <ShieldCheck className="w-6 h-6 text-primary" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5 pt-5 border-t border-border/20">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground/40 tracking-wider uppercase">Business Name</p>
                                        <p className="text-sm font-bold truncate text-black">{editingUser?.businessName || "Unassigned"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground/40 tracking-wider uppercase">Business Id</p>
                                        <p className="text-xs font-mono font-bold opacity-80 truncate text-blue-500">{editingUser?.businessId || "—"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground/40 tracking-wider uppercase">System User Id</p>
                                        <p className="text-xs font-mono font-bold opacity-80 truncate text-black/70">{editingUser?.id || "—"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-muted-foreground/40 tracking-wider uppercase">Current Status</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${editingUser?.status === "Disabled" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}`}>
                                            {editingUser?.status || "Active"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 pt-4 text-left">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between px-1">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/10">
                                            <Key className="w-3.5 h-3.5 text-blue-500" />
                                        </div>
                                        <label className="text-xs font-bold tracking-tight text-black/70 capitalize">Access Token</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 px-2 text-[10px] font-bold text-black/70 border border-border/50 hover:bg-black/5 hover:text-black hover:border-black/20 flex items-center gap-1.5 rounded-lg transition-all"
                                            onClick={async () => {
                                                try {
                                                    const text = await navigator.clipboard.readText()
                                                    setEditForm({ ...editForm, token: text })
                                                    toast.success("Token pasted from clipboard")
                                                } catch {
                                                    toast.error("Failed to read clipboard")
                                                }
                                            }}
                                        >
                                            <ClipboardPaste className="w-3 h-3" />
                                            Paste
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="h-7 px-2 text-[10px] font-bold text-black/70 border border-border/50 hover:bg-black/5 hover:text-black hover:border-black/20 flex items-center gap-1.5 rounded-lg transition-all"
                                            onClick={() => {
                                                navigator.clipboard.writeText(editForm.token)
                                                toast.success("Token copied to clipboard")
                                            }}
                                        >
                                            <Copy className="w-3 h-3" />
                                            Copy
                                        </Button>
                                    </div>
                                </div>
                                <Input
                                    value={editForm.token}
                                    onChange={(e) => setEditForm({ ...editForm, token: e.target.value })}
                                    className="bg-background/50 border-border/40 font-mono text-xs h-12 focus:ring-1 focus:ring-blue-500/20 transition-all rounded-xl text-black"
                                    placeholder="Enter secure access token..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <label className="text-xs font-bold tracking-tight text-black/70 ml-1 capitalize">App Name</label>
                                    <Input
                                        value={editForm.appName}
                                        onChange={(e) => setEditForm({ ...editForm, appName: e.target.value })}
                                        className="h-12 bg-background/50 border-border/40 text-black rounded-xl font-medium text-sm"
                                        placeholder="App identifier"
                                    />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-xs font-bold tracking-tight text-black/70 ml-1 capitalize">Category</label>
                                    <Input
                                        value={editForm.category}
                                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                        className="h-12 bg-background/50 border-border/40 text-black rounded-xl font-medium text-sm"
                                        placeholder="Market category"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-border/50 bg-muted/30 flex items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => setEditingUser(null)}
                        className="h-12 px-8 border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all rounded-xl font-bold cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleEditSave}
                        disabled={saving}
                        variant="outline"
                        className="h-12 px-10 font-bold border-blue-500 text-blue-600 hover:bg-blue-500 hover:text-white active:scale-95 transition-all rounded-xl cursor-pointer shadow-sm shadow-blue-500/10"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>
        </SheetContent>
    )
}

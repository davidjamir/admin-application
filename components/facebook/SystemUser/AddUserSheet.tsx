import React from "react"
import { ShieldCheck, Loader2, Check } from "lucide-react"
import { SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SystemUser } from "@/types/facebook"
import { AddUserSheetProps } from "./types"

export const AddUserSheet: React.FC<AddUserSheetProps> = ({
    setIsSheetOpen, addForm, setAddForm, crawling, saving, handleSave
}) => {
    const onConfirm = () => {
        if (!addForm.token) {
            toast.error("Access token required")
            return
        }
        const newUser: SystemUser = {
            id: addForm.id || Math.random().toString(36).substring(7),
            name: addForm.name || "New Identity",
            token: addForm.token,
            businessId: addForm.businessId,
            businessName: addForm.businessName,
            role: addForm.role,
            roleCode: addForm.roleCode,
            appName: addForm.appName,
            category: addForm.category,
            updatedAt: new Date()
        }
        handleSave(newUser).then((success) => {
            if (success) {
                setIsSheetOpen(false)
                setAddForm({
                    token: "", businessId: "", businessName: "",
                    appName: "", category: "", name: "", id: "",
                    lastSyncedToken: "", role: "Admin", roleCode: ""
                })
            }
        })
    }

    return (
        <SheetContent side="right" className="sm:max-w-[30vw] min-w-[500px] bg-card/95 backdrop-blur-3xl border-l-border/50 shadow-2xl p-0 overflow-hidden">
            <div className="h-full flex flex-col">
                <SheetHeader className="p-8 border-b border-border/50 bg-muted/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-black">
                        <ShieldCheck className="w-32 h-32 rotate-12" />
                    </div>
                    <SheetTitle className="flex items-center gap-4 text-3xl">
                        <div className="p-4 bg-emerald-500/10 rounded-2xl shadow-inner border border-emerald-500/20">
                            <ShieldCheck className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="font-black tracking-tightest text-black">Provision Identity</span>
                            <span className="text-xs font-mono text-muted-foreground uppercase tracking-[0.3em] opacity-60">System Registry v3.0</span>
                        </div>
                    </SheetTitle>
                    <SheetDescription className="text-muted-foreground mt-2 text-left">
                        Fill in the following identity details to add to the registry.
                    </SheetDescription>
                </SheetHeader>
                <div className="px-8 flex flex-col gap-4 py-6 flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Access Token</label>
                            <Input
                                value={addForm.token}
                                onChange={(e) => setAddForm({ ...addForm, token: e.target.value })}
                                placeholder="EAAG..."
                                className="h-11 bg-background/50 border-border/50 focus:ring-primary/20 transition-all font-mono text-xs text-black"
                            />
                        </div>
                        <div className="space-y-2 text-left">
                            <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Business ID</label>
                            <Input
                                value={addForm.businessId}
                                onChange={(e) => setAddForm({ ...addForm, businessId: e.target.value })}
                                placeholder="123456789..."
                                className="h-11 bg-background/50 border-border/50 text-black"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">BM Name</label>
                                <Input value={addForm.businessName} disabled className="h-11 bg-muted/50 text-black" />
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">Role</label>
                                <Input value={addForm.role} disabled className="h-11 bg-muted/50 text-black" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">System User Name</label>
                                <Input value={addForm.name} disabled className="h-11 bg-muted/50 text-black" />
                            </div>
                            <div className="space-y-2 text-left">
                                <label className="text-xs font-bold tracking-tight text-muted-foreground ml-1">System User ID</label>
                                <Input value={addForm.id} disabled className="h-11 bg-muted/50 text-black" />
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 pt-4">
                        {crawling && (
                            <div className="flex items-center justify-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                                <Loader2 className="w-5 h-5 animate-spin text-primary mr-3" />
                                <span className="text-sm font-bold text-primary">Establishing identity link...</span>
                            </div>
                        )}
                        <Button
                            onClick={onConfirm}
                            disabled={crawling || !addForm.token || saving}
                            className="w-full h-12 font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] transition-all bg-primary hover:bg-primary/90 text-white cursor-pointer"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                            {saving ? "Provisioning..." : "Confirm & Register Identity"}
                        </Button>
                    </div>
                </div>
            </div>
        </SheetContent>
    )
}

import React from "react"
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import { DeleteDialogProps } from "./types"

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
    user, onClose, onConfirm, saving
}) => {
    return (
        <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[400px] bg-card/95 backdrop-blur-2xl border-border/50 shadow-2xl p-0 overflow-hidden rounded-2xl">
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                            <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold tracking-tight">Terminate Identity</DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground/70">
                                Requested via management console
                            </DialogDescription>
                        </div>
                    </div>
                    
                    <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 space-y-4">
                        <div className="flex flex-col items-center gap-2 pb-3 border-b border-red-500/10">
                            <p className="text-[10px] font-black uppercase text-red-500/40 tracking-[0.2em] leading-none">Target Identity</p>
                            <div className="flex flex-col items-center gap-1.5">
                                <span className="text-xs font-mono font-bold text-red-600/80 leading-none tracking-tight">{user?.id}</span>
                                <span className="text-sm font-bold text-foreground/90 leading-none">{user?.name}</span>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-red-600/90 leading-relaxed text-center">
                            Permanently terminate this identity?<br/>
                            <span className="text-[11px] opacity-70 font-normal">This action is irreversible.</span>
                        </p>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-muted/20 border-t border-border/50 gap-2 sm:gap-0">
                    <Button 
                        variant="ghost" 
                        onClick={onClose}
                        className="flex-1 h-11 rounded-xl border border-border/30 hover:bg-muted/50 transition-all font-semibold cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="outline"
                        onClick={onConfirm}
                        disabled={saving}
                        className={`flex-1 h-11 rounded-xl transition-all font-bold cursor-pointer border ${
                            saving 
                            ? "bg-red-600 border-transparent text-white shadow-lg shadow-red-500/20" 
                            : "bg-background border-red-500/30 text-red-500 hover:bg-red-500/5 hover:border-red-500/50"
                        }`}
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2 text-white" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        {saving ? "Purging..." : "Terminate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

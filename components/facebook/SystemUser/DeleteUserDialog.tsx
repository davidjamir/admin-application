import React from "react"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DeleteUserDialogProps } from "./types"

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
    deletingUser, setDeletingUser, saving, confirmDelete
}) => {
    return (
        <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
            <DialogContent className="max-w-md bg-card/95 backdrop-blur-3xl border-border/50 shadow-2xl rounded-2xl p-8">
                <div className="flex flex-col items-center text-center gap-6">
                    <div className="p-5 bg-red-500/10 rounded-2xl border border-red-500/20">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <DialogTitle className="text-2xl font-black tracking-tight text-black">Terminate Identity?</DialogTitle>
                        <DialogDescription className="text-sm font-medium text-muted-foreground px-4">
                            You are about to permanently remove <span className="font-bold text-black">{deletingUser?.name}</span> from the personnel registry. This action is destructive and irreversible.
                        </DialogDescription>
                    </div>
                </div>
                <DialogFooter className="mt-8 flex gap-3 sm:justify-center">
                    <Button
                        variant="ghost"
                        onClick={() => setDeletingUser(null)}
                        className="flex-1 h-12 font-bold text-muted-foreground hover:bg-muted/10 transition-all cursor-pointer"
                    >
                        Retain Identity
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={confirmDelete}
                        disabled={saving}
                        className="flex-1 h-12 font-bold shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all bg-red-500 hover:bg-red-600 cursor-pointer"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        {saving ? "Terminating..." : "Terminate"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

import React from "react"
import { CheckCircle2, Copy, Globe, PauseCircle, Pencil, RefreshCcw, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { AdCreativeDetailPanelProps } from "./types"

export const AdCreativeDetailPanel: React.FC<AdCreativeDetailPanelProps> = ({
  selected, editing, editForm, setEditForm, saving, onClose, onStartEdit, onCancelEdit, onSaveEdit, onDelete, websiteOrigins
}) => {
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text)
    toast.success(`Copied ${label}`)
  }

  const handleDelete = async () => {
    await onDelete(selected._id)
    setConfirmDelete(false)
  }

  return (
    <div className="fixed top-0 right-0 h-full w-[440px] bg-background border-l shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col z-40 text-black">
      {confirmDelete && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-card border shadow-xl rounded-xl p-6 w-full max-w-[320px] text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Delete Creative?</h3>
              <p className="text-xs text-muted-foreground mt-1">This action cannot be undone. Area you sure you want to delete this ad creative?</p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button onClick={handleDelete} className="w-full py-2.5 bg-rose-600 text-white rounded-lg text-sm font-bold hover:bg-rose-700 cursor-pointer transition-colors shadow-sm">
                Confirm Delete
              </button>
              <button onClick={() => setConfirmDelete(false)} className="w-full py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 cursor-pointer transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-5 border-b">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Ad Creative</p>
          <h2 className="font-bold text-base truncate">{editing ? editForm?.name : selected.name}</h2>
        </div>
        <div className="flex items-center gap-1 ml-3">
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-full cursor-pointer transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!editing ? (
          <div className="p-5 space-y-5">
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Domain
                </div>
                <div className="font-medium text-sm truncate">{selected.domain || "—"}</div>
                {selected.note && (
                  <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground whitespace-pre-wrap leading-relaxed">{selected.note}</div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Source</div>
                  <div className="font-medium text-sm truncate">{selected.source || "—"}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Priority</div>
                  <div className="font-medium text-sm truncate">{selected.priority}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
              {selected.enabled
                ? <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold"><CheckCircle2 className="w-4 h-4" /> Enabled</span>
                : <span className="flex items-center gap-1.5 text-sm text-rose-500 font-semibold"><PauseCircle className="w-4 h-4" /> Disabled</span>}
            </div>

            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Ad Code</span>
                <button onClick={() => copy(selected.content, "Ad Code")} className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
              <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed max-h-60 overflow-y-auto bg-muted/80 p-2 rounded-md border">{selected.content}</pre>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="text-[10px] uppercase tracking-wider mb-1">Created</div>
                <div className="italic" suppressHydrationWarning>{new Date(selected.createdAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 border">
                <div className="text-[10px] uppercase tracking-wider mb-1">Updated</div>
                <div className="italic" suppressHydrationWarning>{new Date(selected.updatedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "short" })}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name *</label>
              <input type="text" value={editForm!.name} onChange={e => setEditForm(f => f && ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Source</label>
                <input type="text" value={editForm!.source} onChange={e => setEditForm(f => f && ({ ...f, source: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
                <input type="number" min={0} value={editForm!.priority} onChange={e => setEditForm(f => f && ({ ...f, priority: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Domain *</label>
              <select value={editForm!.domain} onChange={e => setEditForm(f => f && ({ ...f, domain: e.target.value, origin: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none cursor-pointer">
                <option value="">Select Domain</option>
                {websiteOrigins.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
                <select value={editForm!.enabled ? "enabled" : "disabled"} onChange={e => setEditForm(f => f && ({ ...f, enabled: e.target.value === "enabled" }))}
                  className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none cursor-pointer">
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</label>
              <input type="text" value={editForm!.note} onChange={e => setEditForm(f => f && ({ ...f, note: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ad Code *</label>
              <textarea rows={12} value={editForm!.content} onChange={e => setEditForm(f => f && ({ ...f, content: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed" />
            </div>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="p-5 border-t flex gap-3">
          <button 
            onClick={() => setConfirmDelete(true)} 
            className="flex-1 py-2.5 rounded-lg border border-rose-200 text-rose-600 text-sm font-medium hover:bg-rose-50 cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
          <button 
            onClick={onStartEdit} 
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
        </div>
      ) : (
        <div className="p-5 border-t flex gap-3">
          <button onClick={onCancelEdit} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted cursor-pointer transition-colors">
            Cancel
          </button>
          <button onClick={onSaveEdit} disabled={saving}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${saving ? "border-green-600 text-green-600 border" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
            {saving ? <><RefreshCcw className="w-4 h-4 animate-spin text-green-600" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>
      )}
    </div>
  )
}

import React from "react"
import { Plus, RefreshCcw, X } from "lucide-react"
import { AdCreativeAddPanelProps } from "./types"

export const AdCreativeAddPanel: React.FC<AdCreativeAddPanelProps> = ({
  onClose, form, setForm, submitting, onSubmit, websiteOrigins
}) => {
  return (
    <div className="fixed top-0 right-0 h-full w-[440px] bg-background border-l shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col z-40 text-black">
      <div className="flex items-center justify-between p-5 border-b">
        <div>
          <h2 className="font-bold text-base">New Ad Creative</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full cursor-pointer transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      <form onSubmit={onSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Name *</label>
          <input type="text" required placeholder="e.g. responsive 1" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Source</label>
            <input type="text" placeholder="e.g. adhub-media" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Priority</label>
            <input type="number" min={0} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Domain *</label>
          <select required value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value, origin: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none cursor-pointer">
            <option value="">Select Domain</option>
            {websiteOrigins.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</label>
            <select value={form.enabled ? "enabled" : "disabled"} onChange={e => setForm(f => ({ ...f, enabled: e.target.value === "enabled" }))}
              className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none cursor-pointer">
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Note</label>
          <input type="text" placeholder="e.g. ADX display" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ad Code *</label>
          <textarea required rows={10} placeholder={"<script async src=\"...\">\n</script>\n<div id=\"...\">...</div>"} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border bg-muted/50 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none leading-relaxed" />
        </div>
      </form>
      <div className="p-5 border-t flex gap-3">
        <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border text-sm font-medium hover:bg-muted cursor-pointer transition-colors">Cancel</button>
        <button onClick={onSubmit} disabled={submitting}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${submitting ? "border-green-600 text-green-600 border" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>
          {submitting ? <><RefreshCcw className="w-4 h-4 animate-spin text-green-600" /> Saving...</> : <><Plus className="w-4 h-4" /> Add Creative</>}
        </button>
      </div>
    </div>
  )
}

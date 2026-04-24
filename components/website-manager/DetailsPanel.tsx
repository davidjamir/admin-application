import { X, Copy, ExternalLink, CheckCircle2, PauseCircle, Calendar } from "lucide-react"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
    ResponsiveContainer, ReferenceLine
} from "recharts"
import { DetailsPanelProps } from "./types"
import { Blog, Wrap, QuotaGroup } from "@/hooks/useWebsiteManager"

const BlogDetails = ({ b, onCopy }: { b: Blog, onCopy: (text: string, label: string) => void }) => (
    <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
            {[
                { l: "DNS", v: b.blogDns },
                { l: "Channel", v: b.channel },
                { l: "Index", v: String(b.blogIndex) },
                { l: "Priority", v: String(b.blogPriority) },
            ].map(({ l, v }) => (
                <div key={l} className="p-3 rounded-lg bg-muted/50 border border-border/40">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{l}</div>
                    <div className="font-medium text-sm truncate">{v || "—"}</div>
                </div>
            ))}
        </div>
        <div className="rounded-lg border border-border/40 bg-muted/50 divide-y divide-border/40">
            {[
                { l: "Gmail User", v: b.blogUser },
                { l: "Blog Email", v: b.blogEmail },
                { l: "Password", v: b.blogPassword },
                { l: "Wrap Domain", v: b.wrapDomain },
            ].map(({ l, v }) => (
                <div key={l} className="flex items-center justify-between px-3 py-2.5 gap-3">
                    <span className="text-xs text-muted-foreground shrink-0 w-28">{l}</span>
                    <span className="text-xs font-mono truncate flex-1">{v || "—"}</span>
                    {v && (
                        <button onClick={() => onCopy(v, l)} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors shrink-0">
                            <Copy className="w-3 h-3" />
                        </button>
                    )}
                </div>
            ))}
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/40">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
            {b.enabled
                ? <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold"><CheckCircle2 className="w-4 h-4" /> Enabled</span>
                : <span className="flex items-center gap-1.5 text-sm text-rose-500 font-semibold"><PauseCircle className="w-4 h-4" /> Disabled</span>}
        </div>
    </div>
)

const WrapDetails = ({ w, onCopy, channel }: { w: Wrap, onCopy: (text: string, label: string) => void, channel?: string }) => (
    <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Channel</div>
                <div className="font-medium text-sm truncate">{channel || "—"}</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Prefix</div>
                <div className="font-medium text-sm truncate">{w.prefix}</div>
            </div>
        </div>
        <div className="rounded-lg border bg-muted/50 divide-y">
            {[
                { l: "Wrap Host", v: w.wrap_host },
                { l: "Target Host", v: w.target_host },
            ].map(({ l, v }) => (
                <div key={l} className="flex items-center justify-between px-3 py-3 gap-3">
                    <span className="text-xs text-muted-foreground shrink-0 w-28">{l}</span>
                    <span className="text-sm font-mono truncate flex-1">{v || "—"}</span>
                    {v && (
                        <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => onCopy(v, l)} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                                <Copy className="w-3 h-3" />
                            </button>
                            {(l === "Wrap Host" || l === "Target Host") && (
                                <a href={`https://${v}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
        <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Full Wrap URL</div>
            <div className="flex items-center gap-2">
                <code className="text-xs font-mono flex-1 text-primary">{w.wrap_host}/{w.prefix}</code>
                <button onClick={() => onCopy(`${w.wrap_host}/${w.prefix}`, "Wrap URL")} className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    <Copy className="w-3 h-3" />
                </button>
                <a href={`https://${w.wrap_host}/${w.prefix}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ExternalLink className="w-3 h-3" />
                </a>
            </div>
        </div>
    </div>
)

const QuotaDetails = ({ g, allDates, dateFilter, channel }: { g: QuotaGroup, allDates: string[], dateFilter: string, channel?: string }) => {
    const qt = g.latest
    const pct = qt.limit > 0 ? Math.round((qt.count / qt.limit) * 100) : 0
    const barColor = pct >= 90 ? "hsl(0,85%,45%)" : pct >= 70 ? "hsl(38,92%,50%)" : "hsl(142,71%,40%)"
    const last10 = [...allDates].reverse().slice(-10)
    const chartData = last10.map(d => {
        const r = g.history.find(h => h.date === d)
        return {
            date: d,
            count: r ? r.count : 0,
            limit: r ? r.limit : (g.latest?.limit || 0),
        }
    })

    const formattedDate = dateFilter === "all" ? "All History" : `${dateFilter.slice(6)}-${dateFilter.slice(4, 6)}-${dateFilter.slice(0, 4)}`

    return (
        <div className="p-5 space-y-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border/40 mb-2">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Channel</div>
                <div className="font-bold text-sm truncate">{channel || "—"}</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg border text-center bg-card shadow-sm border-border/60">
                    <div className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">Posts</div>
                    <div className="font-bold text-xl" style={{ color: barColor }}>{qt.count}</div>
                </div>
                <div className="p-3 rounded-lg border text-center bg-card shadow-sm border-border/60">
                    <div className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">Limit</div>
                    <div className="font-bold text-xl text-black">{qt.limit}</div>
                </div>
                <div className="p-3 rounded-lg border text-center bg-card shadow-sm border-border/60">
                    <div className="text-[10px] text-black font-bold uppercase tracking-wider mb-1">Usage</div>
                    <div className="font-bold text-xl" style={{ color: barColor }}>{pct}%</div>
                </div>
            </div>
            <div className="pt-2 px-1">
                <h3 className="text-xs font-bold text-black uppercase tracking-wider">Post Activity History</h3>
                <p className="text-[10px] text-muted-foreground italic">Trend of posts for <span className="font-bold text-primary">{g.domain}</span> over the last 10 recordable days</p>
            </div>
            <div className="rounded-xl border bg-card p-3 h-[250px] shadow-sm">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,88%)" />
                        <XAxis dataKey="date" tick={{ fontSize: 9 }} tickFormatter={d => d.slice(6)} />
                        <YAxis tick={{ fontSize: 9 }} />
                        <RTooltip 
                            contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                            labelFormatter={d => `Date: ${d.slice(6)}-${d.slice(4, 6)}-${d.slice(0, 4)}`}
                            formatter={(v: number | string) => [v, "Posts"]}
                        />
                        {qt.limit > 0 && <ReferenceLine y={qt.limit} stroke="red" strokeDasharray="3 3" />}
                        <Area type="monotone" dataKey="count" stroke="blue" fill="blue" fillOpacity={0.1} dot={{ r: 4, fill: 'blue', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
            
            <div className="mt-2 p-4 rounded-xl bg-white border border-emerald-600 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                        <Calendar className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-widest">Selected Date</div>
                        <div className="text-sm font-bold text-black">{formattedDate}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export const DetailsPanel: React.FC<DetailsPanelProps> = ({ selected, onClose, onCopy, allDates, dateFilter, wrapChannelMap, quotaChannelMap }) => {
    if (!selected) return null
    const { tab, data } = selected

    const title = tab === "blogs" ? "Blog Information" : tab === "wraps" ? "Wrap Information" : "Quota History"
    const subtitle = tab === "blogs" ? (data as Blog).blogDns : tab === "wraps" ? (data as Wrap).wrap_host : (data as QuotaGroup).domain

    return (
        <div className="fixed inset-y-0 right-0 w-[420px] bg-card border-l shadow-2xl z-40 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-5 py-4 border-b flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-4">
                    <h2 className="text-lg font-bold truncate text-black">{title}</h2>
                    <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer shrink-0"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {tab === "blogs" && <BlogDetails b={data as Blog} onCopy={onCopy} />}
                {tab === "wraps" && <WrapDetails w={data as Wrap} onCopy={onCopy} channel={wrapChannelMap.get((data as Wrap)._id)} />}
                {tab === "quotas" && <QuotaDetails g={data as QuotaGroup} allDates={allDates} dateFilter={dateFilter} channel={quotaChannelMap.get((data as QuotaGroup).domain)} />}
            </div>
        </div>
    )
}

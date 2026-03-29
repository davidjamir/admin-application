import React from "react"
import { CalendarClock, Clock, Copy, Facebook, History, LayoutDashboard, RefreshCcw, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { PageDetailSheetProps } from "./types"

export const PageDetailSheet: React.FC<PageDetailSheetProps> = ({
  selectedPage, onClose, details, detailsLoading, activeTab, setActiveTab, showToken, setShowToken, getHealthColor, setDetails
}) => {
  const [recrawling, setRecrawling] = React.useState(false)
  const sheetColor = getHealthColor(selectedPage.lastScheduledAt)
  const [isIdHovered, setIsIdHovered] = React.useState(false)

  const handleCopyId = () => {
    navigator.clipboard.writeText(selectedPage.pageId)
    toast.success(`Page ID: ${selectedPage.pageId} copied!`)
  }

  const handleRecrawl = async () => {
    const toastId = toast.loading("Recrawling DB...")
    setRecrawling(true)
    try {
      const res = await fetch(`/api/pages/${selectedPage._id.$oid}?force=true`)
      const data = await res.json()
      setDetails(data)
      toast.success("Recrawl complete", { id: toastId })
    } catch {
      toast.error("Recrawl failed", { id: toastId })
    } finally {
      setRecrawling(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end text-black">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity animate-in fade-in" 
        onClick={onClose}
      />
      
      <div className="relative w-full sm:w-[500px] md:w-[700px] lg:w-[800px] h-full bg-background border-l shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        <div className="p-6 border-b flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              {selectedPage.name}
              <a
                href={`https://facebook.com/${selectedPage.pageId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group/fb inline-flex items-center justify-center size-6 ml-2 align-middle cursor-pointer border border-transparent hover:border-[#1877F2]/30 rounded-sm bg-transparent hover:bg-[#1877F2]/10 transition-all"
                title="View on Facebook"
              >
                <Facebook className="size-3.5 text-[#1877F2]" />
              </a>
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1.5">
              {selectedPage.topic && (
                <span 
                  className="px-2 py-0.5 rounded-md font-medium border"
                  style={{ color: sheetColor, borderColor: `${sheetColor}40`, backgroundColor: `${sheetColor}10` }}
                >
                  {selectedPage.topic}
                </span>
              )}
              <span>•</span>
              <span 
                className="cursor-pointer transition-colors"
                onMouseEnter={() => setIsIdHovered(true)}
                onMouseLeave={() => setIsIdHovered(false)}
                onClick={handleCopyId}
                style={{ color: isIdHovered ? sheetColor : undefined }}
              >
                ID: <span className="font-medium">{selectedPage.pageId}</span>
              </span>
              <span className="flex-1"></span>
              {details?.cachedAt && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground italic">
                    <Clock className="w-3 h-3 not-italic" />
                    Cached Sync: {new Date(details.cachedAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "medium", timeStyle: "medium" })}
                    <button 
                      onClick={handleRecrawl}
                      disabled={recrawling}
                      className={`transition-colors cursor-pointer p-0.5 rounded-sm not-italic disabled:opacity-50 ${recrawling ? "text-green-600" : "hover:text-foreground text-muted-foreground"}`}
                      title="Force Recrawl"
                    >
                      <RefreshCcw className={`w-3 h-3 ${recrawling ? "animate-spin" : ""}`} />
                    </button>
                  </span>
                </>
              )}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6 bg-muted/30 border-b text-sm">
          <div>
            <span className="text-muted-foreground block mb-1 text-[10px] font-bold tracking-wider">System User</span>
            <span className="font-medium">{selectedPage.systemUserName}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1 text-[10px] font-bold tracking-wider">Source App</span>
            <span className="font-medium">
              {selectedPage.appName ? selectedPage.appName.charAt(0).toUpperCase() + selectedPage.appName.slice(1).toLowerCase() : "N/A"}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground block mb-1 text-[10px] font-bold tracking-wider">Access Token</span>
            <div className="flex items-center gap-2 bg-muted p-2 rounded-md font-mono text-xs overflow-hidden border">
              <span className="truncate flex-1">
                {showToken ? selectedPage.token : "••••••••••••••••••••••••••••••••••••••••••••••••"}
              </span>
              <button 
                onClick={async () => {
                  await navigator.clipboard.writeText(selectedPage.token)
                  toast.success("Copied Access Token to clipboard")
                }} 
                className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors cursor-pointer" 
                title="Copy Token"
              >
                <Copy className="size-3.5" />
              </button>
              <button onClick={() => setShowToken(!showToken)} className="text-primary font-medium hover:underline whitespace-nowrap px-1 cursor-pointer">
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {detailsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          ) : details ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-muted-foreground" /> Scheduled Post Stats
              </h3>
              <div className="grid grid-cols-3 gap-3 mb-8">
                <StatCard label="Today" value={details.stats?.today} color="hsl(142, 71%, 40%)" />
                <StatCard label="Tomorrow" value={details.stats?.tomorrow} color="hsl(0, 85%, 60%)" />
                <StatCard label="Later On" value={details.stats?.later} color="hsl(0, 85%, 38%)" />
              </div>

              <div className="flex border-b mb-4 gap-4">
                <TabButton 
                  active={activeTab === "queue"} 
                  onClick={() => setActiveTab("queue")} 
                  label="Upcoming Queue" 
                  icon={<CalendarClock className="w-4 h-4"/>} 
                  activeColor={sheetColor}
                />
                <TabButton 
                  active={activeTab === "history"} 
                  onClick={() => setActiveTab("history")} 
                  label="Post History" 
                  icon={<History className="w-4 h-4"/>} 
                  activeColor={sheetColor}
                />
              </div>

              <div className="space-y-3">
                {activeTab === "queue" && details.queue.map(q => (
                  <PostItem key={q.id} content={q.content} timestamp={q.scheduledAt} createdAt={q.createdAt} label="Scheduled" color={getHealthColor(q.scheduledAt)} />
                ))}
                {activeTab === "history" && details.history.map(h => (
                  <PostItem key={h.id} content={h.content} timestamp={h.postedAt} label="Posted" status={h.status} />
                ))}
                {activeTab === "queue" && details.queue.length === 0 && <EmptyState icon={<CalendarClock className="w-8 h-8 mx-auto mb-2 opacity-50" />} text="No upcoming posts found in queue." />}
                {activeTab === "history" && details.history.length === 0 && <EmptyState icon={<History className="w-8 h-8 mx-auto mb-2 opacity-50" />} text="No posting history records found." />}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <Card className="bg-card shadow-sm border-l-[3px]" style={{ borderLeftColor: color }}>
    <CardContent className="p-3 text-center">
      <div className="text-2xl font-bold" style={{ color }}>{value || 0}</div>
      <div className="text-[11px] font-medium text-muted-foreground tracking-wider mt-1">{label}</div>
    </CardContent>
  </Card>
)

const TabButton = ({ active, onClick, label, icon, activeColor }: { active: boolean; onClick: () => void; label: string; icon: React.ReactNode; activeColor: string }) => (
  <button 
    onClick={onClick}
    className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors cursor-pointer ${active ? "text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
    style={{ borderBottomColor: active ? activeColor : 'transparent' }}
  >
    <div className="flex items-center gap-2">{icon} {label}</div>
  </button>
)

const PostItem = ({ content, timestamp, label, color, status, createdAt }: { content: string; timestamp: number; label: string; color?: string; status?: string; createdAt?: number }) => {
  const handleCopy = async () => {
    const textToCopy = content.replace("ItemID: ", "")
    await navigator.clipboard.writeText(textToCopy)
    toast.success("Copied ItemID to clipboard")
  }

  return (
    <div className={`p-3.5 rounded-lg border bg-card text-sm shadow-sm transition-hover hover:border-primary/50 ${status ? 'opacity-80' : ''}`} style={color ? { borderLeft: `3px solid ${color}` } : {}}>
      <div className="flex items-start justify-between gap-3 mb-2">
        {status && <div className={`mt-1.5 size-2.5 rounded-full shrink-0 ${status === "Success" ? "bg-emerald-500" : "bg-rose-500"}`} />}
        <p className="text-foreground flex-1 break-all mt-1">{content}</p>
        <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors cursor-pointer shrink-0" title="Copy ItemID">
          <Copy className="size-3.5" />
        </button>
      </div>
      <div className="text-xs flex items-center justify-between text-foreground">
        <p className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" style={color ? { color } : { color: 'hsl(var(--muted-foreground))' }}/> {label}: <span className="font-bold">{new Date(timestamp).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
        </p>
        {createdAt && (
          <p className="text-muted-foreground italic opacity-70">
            Created: <span className="font-bold italic text-foreground/80">{new Date(createdAt).toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh", year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}</span>
          </p>
        )}
      </div>
    </div>
  )
}

const EmptyState = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="py-8 text-center text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
    {icon}
    <p className="text-sm">{text}</p>
  </div>
)

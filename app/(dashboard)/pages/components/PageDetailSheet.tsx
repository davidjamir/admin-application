import React from "react"
import { CalendarClock, Clock, Copy, Facebook, History, LayoutDashboard, RefreshCcw, X, Pencil, Check, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { PageDetailSheetProps } from "./types"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export const PageDetailSheet: React.FC<PageDetailSheetProps> = ({
  selectedPage, onClose, details, detailsLoading, activeTab, setActiveTab, showToken, setShowToken, getHealthColor, setDetails, onRefresh
}) => {
  const [recrawling, setRecrawling] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [editValues, setEditValues] = React.useState({
    systemUserName: selectedPage.systemUserName,
    appName: selectedPage.appName,
    trafficInterval: selectedPage.trafficInterval || 0,
    viralInterval: selectedPage.viralInterval || 0,
    token: selectedPage.token,
    topic: selectedPage.topic || ""
  })

  React.useEffect(() => {
    setEditValues({
      systemUserName: selectedPage.systemUserName,
      appName: selectedPage.appName,
      trafficInterval: selectedPage.trafficInterval || 0,
      viralInterval: selectedPage.viralInterval || 0,
      token: selectedPage.token,
      topic: selectedPage.topic || ""
    })
    setIsEditing(false)
  }, [selectedPage])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/pages/${selectedPage._id.$oid}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editValues)
      })
      if (!res.ok) throw new Error("Failed to update page")
      toast.success("Page updated successfully")
      setIsEditing(false)
      onRefresh?.()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error("Failed to update page")
    } finally {
      setSaving(false)
    }
  }

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

        <div className="bg-muted/30 border-b relative">
          <div className="absolute top-4 right-6 z-10">
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-8 px-3 text-xs border-red-500/30 text-red-600 hover:bg-red-50 cursor-pointer"
                  onClick={() => {
                    setIsEditing(false)
                    setEditValues({
                      systemUserName: selectedPage.systemUserName,
                      appName: selectedPage.appName,
                      trafficInterval: selectedPage.trafficInterval || 0,
                      viralInterval: selectedPage.viralInterval || 0,
                      token: selectedPage.token,
                      topic: selectedPage.topic || ""
                    })
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 cursor-pointer"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Check className="w-3 h-3 mr-1.5" />}
                  Save
                </Button>
              </div>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 px-3 text-xs border-primary/20 text-primary hover:bg-primary/5 cursor-pointer"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-3 h-3 mr-1.5" />
                Edit Info
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 p-6 pt-12 text-sm">
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
            <div>
              <span className="text-muted-foreground block mb-1 text-[10px] font-bold tracking-wider">Traffic Interval</span>
              {isEditing ? (
                <div className="relative">
                  <Input 
                    type="number"
                    value={editValues.trafficInterval === 0 ? "" : editValues.trafficInterval}
                    onChange={(e) => setEditValues({ ...editValues, trafficInterval: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                    placeholder="0"
                    className="h-8 text-xs bg-background pr-10"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground">minutes</span>
                </div>
              ) : (
                <span className="font-medium">{selectedPage.trafficInterval || 0} minutes</span>
              )}
            </div>
            <div>
              <span className="text-muted-foreground block mb-1 text-[10px] font-bold tracking-wider">Viral Interval</span>
              {isEditing ? (
                <div className="relative">
                  <Input 
                    type="number"
                    value={editValues.viralInterval === 0 ? "" : editValues.viralInterval}
                    onChange={(e) => setEditValues({ ...editValues, viralInterval: e.target.value === "" ? 0 : parseInt(e.target.value) })}
                    placeholder="0"
                    className="h-8 text-xs bg-background pr-12"
                  />
                  <span className="absolute right-2 top-1.5 text-[10px] text-muted-foreground">minutes</span>
                </div>
              ) : (
                <span className="font-medium">{selectedPage.viralInterval || 0} minutes</span>
              )}
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
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {detailsLoading ? (
            <LoadingScreen fullScreen={false} message="Analyzing performance metrics" />
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

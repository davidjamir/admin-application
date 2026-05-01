import React from "react"
import { CalendarClock, Clock, Copy, Facebook, History, LayoutDashboard, RefreshCcw, X, Pencil, Check, Loader2, Trash2, Square, CheckSquare } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { PageDetailSheetProps } from "./types"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DeletePageDialog } from "./DeletePageDialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const getInitialEditValues = (page: PageDetailSheetProps["selectedPage"]) => ({
  systemUserName: page.systemUserName,
  appName: page.appName,
  trafficInterval: page.trafficInterval || 0,
  viralInterval: page.viralInterval || 0,
  defaultTitle: page.defaultTitle || "",
  defaultCtaImage: page.defaultCtaImage || "",
  defaultCtaVideo: page.defaultCtaVideo || "",
  token: page.token,
  topic: page.topic || ""
})

export const PageDetailSheet: React.FC<PageDetailSheetProps> = ({
  selectedPage, onClose, details, detailsLoading, activeTab, setActiveTab, showToken, setShowToken, getHealthColor, getLatestScheduledAt, setDetails, onDelete, onRefresh
}) => {
  const [recrawling, setRecrawling] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [clearingQueue, setClearingQueue] = React.useState(false)
  const [deletingQueueItemId, setDeletingQueueItemId] = React.useState<string | null>(null)
  const [deletingSelectedQueueItems, setDeletingSelectedQueueItems] = React.useState(false)
  const [selectedQueueItemIds, setSelectedQueueItemIds] = React.useState<Set<string>>(new Set())
  const [editValues, setEditValues] = React.useState(() => getInitialEditValues(selectedPage))

  React.useEffect(() => {
    setEditValues(getInitialEditValues(selectedPage))
    setIsEditing(false)
    setSelectedQueueItemIds(new Set())
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

  const sheetColor = getHealthColor(getLatestScheduledAt(selectedPage))
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

  const handleClearQueue = async () => {
    setClearingQueue(true)
    try {
      const res = await fetch(`/api/pages/${selectedPage._id.$oid}/queue`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to clear queue")
      }

      if (details) {
        setDetails({
          ...details,
          stats: { today: 0, tomorrow: 0, later: 0 },
          queue: [],
          cachedAt: Date.now(),
        })
      }

      setSelectedQueueItemIds(new Set())
      toast.success(`Cleared ${data.deletedCount ?? 0} queue items`)
      onRefresh?.()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to clear queue")
      throw error
    } finally {
      setClearingQueue(false)
    }
  }

  const handleDeleteQueueItem = async (itemId: string, scheduledAt: number) => {
    setDeletingQueueItemId(itemId)
    try {
      const res = await fetch(`/api/pages/${selectedPage._id.$oid}/queue/${itemId}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to delete queue item")
      }

      if (details) {
        const nextStats = { ...details.stats }
        const bucket = getQueueStatsBucket(scheduledAt)
        if (bucket) nextStats[bucket] = Math.max(0, nextStats[bucket] - 1)

        setDetails({
          ...details,
          stats: nextStats,
          queue: details.queue.filter((item) => item.id !== itemId),
          cachedAt: Date.now(),
        })
      }

      setSelectedQueueItemIds((current) => {
        const next = new Set(current)
        next.delete(itemId)
        return next
      })
      toast.success("Queue item deleted")
      onRefresh?.()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to delete queue item")
      throw error
    } finally {
      setDeletingQueueItemId(null)
    }
  }

  const handleToggleQueueItem = (itemId: string) => {
    setSelectedQueueItemIds((current) => {
      const next = new Set(current)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  const selectedQueueItems = React.useMemo(() => {
    return details?.queue.filter((item) => selectedQueueItemIds.has(item.id)) ?? []
  }, [details?.queue, selectedQueueItemIds])

  const handleDeleteSelectedQueueItems = async () => {
    if (selectedQueueItems.length === 0) return

    setDeletingSelectedQueueItems(true)
    try {
      await Promise.all(
        selectedQueueItems.map(async (item) => {
          const res = await fetch(`/api/pages/${selectedPage._id.$oid}/queue/${item.id}`, {
            method: "DELETE",
          })
          const data = await res.json().catch(() => ({}))

          if (!res.ok || data.error) {
            throw new Error(data.error || "Failed to delete selected queue items")
          }
        })
      )

      if (details) {
        const nextStats = { ...details.stats }
        selectedQueueItems.forEach((item) => {
          const bucket = getQueueStatsBucket(item.scheduledAt)
          if (bucket) nextStats[bucket] = Math.max(0, nextStats[bucket] - 1)
        })

        setDetails({
          ...details,
          stats: nextStats,
          queue: details.queue.filter((item) => !selectedQueueItemIds.has(item.id)),
          cachedAt: Date.now(),
        })
      }

      toast.success(`Deleted ${selectedQueueItems.length} selected items`)
      setSelectedQueueItemIds(new Set())
      onRefresh?.()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Failed to delete selected queue items")
      throw error
    } finally {
      setDeletingSelectedQueueItems(false)
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
          <div className="flex items-center gap-1">
            <DeletePageDialog
              page={selectedPage}
              onDelete={onDelete}
              triggerSize="sm"
              triggerLabel="Delete"
              triggerClassName="border border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
            />
            <button 
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
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
                    setEditValues(getInitialEditValues(selectedPage))
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
            {(isEditing || selectedPage.defaultTitle) && (
              <div className="col-span-2">
                <span className="text-muted-foreground block mb-1 text-[10px] font-bold tracking-wider">Default Title</span>
                {isEditing ? (
                  <Input
                    value={editValues.defaultTitle}
                    onChange={(e) => setEditValues({ ...editValues, defaultTitle: e.target.value })}
                    placeholder="Default title"
                    className="h-8 text-xs bg-background"
                  />
                ) : (
                  <span className="font-medium">{selectedPage.defaultTitle}</span>
                )}
              </div>
            )}
            {(isEditing || selectedPage.defaultCtaImage) && (
              <div>
                <span className="text-muted-foreground block mb-1 text-[10px] font-bold tracking-wider">Default CTA Image</span>
                {isEditing ? (
                  <Input
                    value={editValues.defaultCtaImage}
                    onChange={(e) => setEditValues({ ...editValues, defaultCtaImage: e.target.value })}
                    placeholder="Follow page, read more..."
                    className="h-8 text-xs bg-background"
                  />
                ) : (
                  <span className="font-medium">{selectedPage.defaultCtaImage}</span>
                )}
              </div>
            )}
            {(isEditing || selectedPage.defaultCtaVideo) && (
              <div>
                <span className="text-muted-foreground block mb-1 text-[10px] font-bold tracking-wider">Default CTA Video</span>
                {isEditing ? (
                  <Input
                    value={editValues.defaultCtaVideo}
                    onChange={(e) => setEditValues({ ...editValues, defaultCtaVideo: e.target.value })}
                    placeholder="Follow for more videos..."
                    className="h-8 text-xs bg-background"
                  />
                ) : (
                  <span className="font-medium">{selectedPage.defaultCtaVideo}</span>
                )}
              </div>
            )}
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

              <div className="mb-4 flex items-start justify-between gap-4 border-b">
                <div className="flex gap-4">
                  <TabButton 
                    active={activeTab === "queue"} 
                    onClick={() => setActiveTab("queue")} 
                    label={details.queue.length === 0 ? "Upcoming Queue" : `Upcoming Queue (${details.queue.length})`} 
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
                {activeTab === "queue" && (
                  <div className="flex items-center gap-2">
                    {selectedQueueItems.length > 0 && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="cursor-pointer border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted hover:text-foreground disabled:opacity-50"
                          disabled={deletingSelectedQueueItems}
                          onClick={() => setSelectedQueueItemIds(new Set())}
                          title="Clear Selected"
                        >
                          <X data-icon="inline-start" />
                          Clear Selected
                        </Button>
                        <DeleteSelectedQueueDialog
                          itemCount={selectedQueueItems.length}
                          isDeleting={deletingSelectedQueueItems}
                          onDelete={handleDeleteSelectedQueueItems}
                        />
                      </>
                    )}
                    {selectedQueueItems.length === 0 && details.queue.length > 0 && (
                      <ClearQueueDialog
                        pageName={selectedPage.name}
                        itemCount={details.queue.length}
                        isClearing={clearingQueue}
                        onClear={handleClearQueue}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {activeTab === "queue" && details.queue.map(q => (
                  <PostItem
                    key={q.id}
                    content={q.content}
                    timestamp={q.scheduledAt}
                    createdAt={q.createdAt}
                    label="Scheduled"
                    color={getHealthColor(q.scheduledAt)}
                    onDelete={() => handleDeleteQueueItem(q.id, q.scheduledAt)}
                    isDeleting={deletingQueueItemId === q.id}
                    isSelected={selectedQueueItemIds.has(q.id)}
                    onToggleSelect={() => handleToggleQueueItem(q.id)}
                  />
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

const ClearQueueDialog = ({
  pageName,
  itemCount,
  isClearing,
  onClear,
}: {
  pageName: string
  itemCount: number
  isClearing: boolean
  onClear: () => Promise<void>
}) => {
  const [open, setOpen] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onClear()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={itemCount === 0 || isClearing}
        >
          <Trash2 data-icon="inline-start" />
          Clear All Items
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Clear all queue items?</DialogTitle>
            <DialogDescription>
              Are you sure you want to clear all queue items for <span className="font-medium text-foreground">{pageName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer" disabled={isClearing}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" className="cursor-pointer" disabled={isClearing}>
              {isClearing ? "Clearing..." : "Clear all"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const DeleteSelectedQueueDialog = ({
  itemCount,
  isDeleting,
  onDelete,
}: {
  itemCount: number
  isDeleting: boolean
  onDelete: () => Promise<void>
}) => {
  const [open, setOpen] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await onDelete()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer border-destructive/30 text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
          disabled={isDeleting}
        >
          <Trash2 data-icon="inline-start" />
          Delete Selected ({itemCount})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Delete selected queue items?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {itemCount} selected queue items? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" className="cursor-pointer" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete selected"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const getQueueStatsBucket = (timestamp: number): "today" | "tomorrow" | "later" | null => {
  if (timestamp < Date.now()) return null

  const getHCMDateStr = (ts: number) => {
    return new Date(ts).toLocaleDateString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  }

  const nowMs = Date.now()
  const itemDate = getHCMDateStr(timestamp)
  if (itemDate === getHCMDateStr(nowMs)) return "today"
  if (itemDate === getHCMDateStr(nowMs + 86400000)) return "tomorrow"
  return "later"
}

const PostItem = ({
  content,
  timestamp,
  label,
  color,
  status,
  createdAt,
  onDelete,
  isDeleting,
  isSelected,
  onToggleSelect,
}: {
  content: string
  timestamp: number
  label: string
  color?: string
  status?: string
  createdAt?: number
  onDelete?: () => Promise<void>
  isDeleting?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [isHovered, setIsHovered] = React.useState(false)
  const activeColor = color || (status === "Success" ? "hsl(142, 71%, 45%)" : status ? "hsl(348, 83%, 55%)" : undefined)
  const itemId = content.replace("ItemID: ", "")

  const handleCopyItemId = async (e?: React.SyntheticEvent) => {
    e?.stopPropagation()
    await navigator.clipboard.writeText(itemId)
    toast.success("Copied ItemID to clipboard")
  }

  const handleDeleteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!onDelete) return

    await onDelete()
    setDeleteDialogOpen(false)
  }

  return (
    <div
      className={`group/queue-item p-3.5 rounded-lg border bg-card text-sm transition-all ${status ? 'opacity-80' : ''} ${onToggleSelect ? 'cursor-pointer' : ''} ${isSelected ? 'border-destructive' : ''}`}
      onClick={onToggleSelect ? () => onToggleSelect() : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...(activeColor ? { borderLeftColor: activeColor, borderLeftWidth: 3 } : {}),
        ...(isHovered && isSelected
          ? {
              borderTopColor: "var(--destructive)",
              borderRightColor: "var(--destructive)",
              borderBottomColor: "var(--destructive)",
            }
          : {}),
        ...(isHovered && activeColor && !isSelected
          ? {
              borderTopColor: activeColor,
              borderRightColor: activeColor,
              borderBottomColor: activeColor,
            }
          : {}),
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        {status && <div className={`mt-1.5 size-2.5 rounded-full shrink-0 ${status === "Success" ? "bg-emerald-500" : "bg-rose-500"}`} />}
        <div className="mt-1 flex min-w-0 flex-1 items-center gap-1.5 text-foreground">
          <span className="shrink-0 text-muted-foreground">ItemID:</span>
          <div className="group/itemid-row flex min-w-0 flex-1 items-center gap-1.5 [&:has(>button:first-of-type:hover)>button:last-of-type]:border-emerald-600 [&:has(>button:first-of-type:hover)>button:last-of-type]:text-emerald-600 [&:has(>button:last-of-type:hover)>button:last-of-type]:border-emerald-600 [&:has(>button:last-of-type:hover)>button:last-of-type]:text-emerald-600">
            <button
              type="button"
              onClick={(e) => {
                void handleCopyItemId(e)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  void handleCopyItemId(e)
                }
              }}
              title="Copy ItemID (click)"
              className="min-w-0 max-w-full shrink grow-0 cursor-pointer rounded-sm text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <span className="block min-w-0 max-w-full truncate pb-0.5 font-mono text-xs font-medium underline-offset-2 decoration-foreground/70 transition-[text-decoration-color] hover:underline group-hover/itemid-row:underline">
                {itemId}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                void handleCopyItemId(e)
              }}
              title="Copy ItemID"
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-sm border border-transparent p-0 text-muted-foreground opacity-0 transition-colors cursor-pointer hover:border-emerald-600 hover:bg-muted hover:text-emerald-600 group-hover/itemid-row:opacity-100 group-hover/queue-item:opacity-100"
            >
              <Copy className="size-2.5" />
            </button>
          </div>
        </div>
        <div className="flex w-16 shrink-0 items-center justify-end gap-1">
          {onDelete && (
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="p-1.5 rounded-md border border-transparent text-destructive opacity-0 transition-all cursor-pointer hover:border-destructive hover:bg-destructive/10 group-hover/queue-item:opacity-100"
                  title="Delete queue item"
                  disabled={isDeleting}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </DialogTrigger>
              <DialogContent onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleDeleteSubmit}>
                  <DialogHeader>
                    <DialogTitle>Delete this queue item?</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this item from the queue? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="outline" className="cursor-pointer" disabled={isDeleting}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" variant="destructive" className="cursor-pointer" disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {onToggleSelect && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleSelect()
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className={`p-1.5 rounded-md text-muted-foreground transition-opacity cursor-pointer hover:bg-muted hover:text-foreground ${isSelected ? 'opacity-100' : 'opacity-0'} group-hover/queue-item:opacity-100`}
              title={isSelected ? "Unselect item" : "Select item"}
              aria-pressed={isSelected}
            >
              {isSelected ? (
                <CheckSquare className="size-3.5 text-destructive" />
              ) : (
                <Square className="size-3.5" />
              )}
            </button>
          )}
        </div>
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

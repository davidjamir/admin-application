"use client"

import React from "react"
import { useBloggerAccounts, BloggerAccount } from "@/hooks/useBloggerAccounts"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  RefreshCcw, 
  Mail, 
  Clock, 
  Search,
  KeyRound
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sheet } from "@/components/ui/sheet"
import { BloggerAccountSheet } from "@/components/blogger/BloggerAccountSheet"

export default function BloggerAccountsPage() {
  const { accounts, loading, lastSyncedAt, refresh } = useBloggerAccounts()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("All")
  const [selectedAccount, setSelectedAccount] = React.useState<BloggerAccount | null>(null)
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const formatDate = (date: string | { $date: string }) => {
    const dateStr = typeof date === 'string' ? date : date.$date
    return new Date(dateStr).toLocaleString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })
  }

  const isExpired = (date: string | { $date: string }) => {
    const dateStr = typeof date === 'string' ? date : date.$date
    return new Date(dateStr) < new Date()
  }

  const truncateToken = (token: string) => {
    if (!token) return "—"
    if (token.length <= 10) return token
    return `${token.slice(0, 5)}...${token.slice(-5)}`
  }

  const getStatus = (account: BloggerAccount) => {
    const updatedDate = typeof account.updatedAt === 'string' ? account.updatedAt : account.updatedAt.$date
    const diffMins = (new Date().getTime() - new Date(updatedDate).getTime()) / (1000 * 60)
    
    if (diffMins > 65) {
      return { label: 'Disabled', class: 'bg-red-100 text-red-600' }
    }
    
    if (isExpired(account.expired)) {
      return { label: 'Expired', class: 'bg-red-100 text-red-600' }
    }
    
    return { label: 'Active', class: 'bg-emerald-100 text-emerald-600' }
  }

  const filteredAccounts = accounts.filter(acc => {
    const matchesSearch = acc.email.toLowerCase().includes(searchQuery.toLowerCase())
    const status = getStatus(acc)
    const matchesStatus = statusFilter === "All" || status.label === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-sm">
            <KeyRound className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-black">
              Blogger API
            </h1>
            <p className="text-muted-foreground text-sm font-medium">
              Manage credentials and token lifecycle.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastSyncedAt && (
            <span className="text-xs text-muted-foreground italic">
              Data synced: {lastSyncedAt.toLocaleString("en-US", { 
                timeZone: "Asia/Ho_Chi_Minh",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
              })}
            </span>
          )}
          <button 
            onClick={() => refresh()} 
            disabled={loading}
            className={`p-2 rounded-md transition-all cursor-pointer active:scale-95 border border-transparent ${
              loading 
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                : 'bg-muted/50 hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/20 text-muted-foreground'
            }`}
            title="Refresh Data"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by email..." 
            className="pl-10 h-11 bg-background/50 border-border/40 rounded-xl focus:ring-1 focus:ring-blue-500/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] !h-11 rounded-xl border-border/40 bg-background/50 font-medium">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/50 backdrop-blur-xl">
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
            <SelectItem value="Disabled">Disabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium tracking-tight text-black">
          Showing{" "}
          <span className="font-bold tabular-nums">{filteredAccounts.length}</span>{" "}
          {filteredAccounts.length === 1 ? "account" : "accounts"} in{" "}
          <span className="font-bold">
            {statusFilter === "All" ? "All statuses" : statusFilter}
          </span>
        </p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="py-5 font-bold text-black/70 text-xs pl-8 w-[56px]">#</TableHead>
              <TableHead className="py-5 font-bold text-black/70 text-xs w-[25%]">Account</TableHead>
              <TableHead className="py-5 font-bold text-black/70 text-xs w-[100px]">Status</TableHead>
              <TableHead className="py-5 font-bold text-black/70 text-xs w-[80px]">Version</TableHead>
              <TableHead className="py-5 font-bold text-black/70 text-xs w-[140px]">Access Token</TableHead>
              <TableHead className="py-5 font-bold text-black/70 text-xs w-[140px]">Refresh Token</TableHead>
              <TableHead className="py-5 font-bold text-black/70 text-xs w-[150px]">Expiration</TableHead>
              <TableHead className="py-5 font-bold text-black/70 text-xs px-8 w-[150px]">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border/40">
                  <TableCell className="pl-8 py-5"><Skeleton className="h-5 w-5 rounded-lg" /></TableCell>
                  <TableCell className="py-5"><Skeleton className="h-10 w-48 rounded-lg" /></TableCell>
                  <TableCell className="py-5"><Skeleton className="h-8 w-20 rounded-lg" /></TableCell>
                  <TableCell className="py-5"><Skeleton className="h-8 w-16 rounded-lg" /></TableCell>
                  <TableCell className="py-5"><Skeleton className="h-8 w-32 rounded-lg" /></TableCell>
                  <TableCell className="py-5"><Skeleton className="h-8 w-32 rounded-lg" /></TableCell>
                  <TableCell className="py-5"><Skeleton className="h-8 w-32 rounded-lg" /></TableCell>
                  <TableCell className="px-8 py-5"><Skeleton className="h-8 w-32 rounded-lg" /></TableCell>
                </TableRow>
              ))
            ) : filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Mail className="w-10 h-10 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium tracking-tight">No accounts registered yet</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account, index) => (
                <TableRow
                  key={account._id}
                  className="group hover:bg-muted/20 border-border/40 transition-colors cursor-pointer"
                  onClick={() => { setSelectedAccount(account); setSheetOpen(true) }}
                >
                  <TableCell className="pl-8 py-5 text-sm font-normal text-black/80 tracking-tight">
                    {index + 1}
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-4">
                      <div className="size-9 bg-blue-500/5 rounded-lg border border-blue-500/10 flex items-center justify-center">
                        <Mail className="w-4.5 h-4.5 text-blue-500/80" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm text-black tracking-tight">{account.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    {(() => {
                      const status = getStatus(account)
                      return (
                        <Badge 
                          variant="secondary" 
                          className={`text-[9px] h-4 px-1.5 font-medium rounded-md border-transparent ${status.class}`}
                        >
                          {status.label}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="py-5">
                    <span className="text-[10px] text-black/40 font-bold px-1.5 py-0.5 rounded-md border border-black/5 bg-black/[0.02] tracking-wider">
                      v{account.version}
                    </span>
                  </TableCell>
                  <TableCell className="py-5">
                    <div 
                      className="flex items-center gap-1 group/token cursor-pointer hover:bg-blue-500/5 p-1 rounded-md transition-colors w-fit"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleCopy(account.accessToken, "Access Token")
                      }}
                      title="Click to copy Access Token"
                    >
                      <code className="text-sm font-mono font-normal text-black/80">
                        {truncateToken(account.accessToken)}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div 
                      className="flex items-center gap-1 group/token cursor-pointer hover:bg-emerald-500/5 p-1 rounded-md transition-colors w-fit"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleCopy(account.refreshToken, "Refresh Token")
                      }}
                      title="Click to copy Refresh Token"
                    >
                      <code className="text-sm font-mono font-normal text-black/80">
                        {truncateToken(account.refreshToken)}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center gap-2 text-sm font-normal text-black/80 tracking-tight">
                      <Clock className="size-3 text-muted-foreground/60" />
                      {formatDate(account.expired)}
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-5 text-sm font-normal text-black/80 tracking-tight">
                    <div className="flex items-center gap-2">
                      <Clock className="size-3 text-muted-foreground/60" />
                      {formatDate(account.updatedAt)}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        {selectedAccount && (
          <BloggerAccountSheet
            account={selectedAccount}
            formatDate={formatDate}
          />
        )}
      </Sheet>
    </div>
  )
}

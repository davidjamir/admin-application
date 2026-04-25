"use client"

import React from "react"
import {
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { Skeleton } from "@/components/ui/skeleton"
import { BloggerAccount } from "@/hooks/useBloggerAccounts"
import {
  KeyRound,
  Mail,
  Globe,
  BookOpen,
  Clock,
  AlertCircle,
  ExternalLink,
  ChevronDown,
} from "lucide-react"

interface Blog {
  id: string
  name: string
  url: string
  description?: string
  posts?: { totalItems: number }
  published?: string
  updated?: string
  status?: string
}

interface BloggerAccountSheetProps {
  account: BloggerAccount
  formatDate: (date: string | { $date: string }) => string
}

import { toast } from "sonner"
export function BloggerAccountSheet({ account, formatDate }: BloggerAccountSheetProps) {
  const [blogs, setBlogs] = React.useState<Blog[]>([])
  const [loadingBlogs, setLoadingBlogs] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [expandedBlogId, setExpandedBlogId] = React.useState<string | null>(null)



  React.useEffect(() => {
    const fetchBlogs = async () => {
      setLoadingBlogs(true)
      setError(null)
      try {
        const res = await fetch("https://www.googleapis.com/blogger/v3/users/self/blogs", {
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
          },
        })
        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error?.message || "Failed to fetch blogs")
        }
        const data = await res.json()
        setBlogs(data.items || [])
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoadingBlogs(false)
      }
    }

    fetchBlogs()
  }, [account.accessToken])

  return (
    <SheetContent
      side="right"
      className="sm:max-w-[38vw] min-w-[520px] bg-card/95 backdrop-blur-3xl border-l-border/50 shadow-2xl p-0 overflow-hidden"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <SheetHeader className="p-8 border-b border-border/50 bg-muted/20 relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <KeyRound className="w-40 h-40 -rotate-12" />
          </div>
          <SheetTitle className="flex items-center gap-4">
            <div className="p-3.5 bg-blue-500/10 rounded-2xl border border-blue-500/20 shadow-sm shrink-0">
              <Mail className="w-7 h-7 text-blue-500" />
            </div>
            <div className="flex flex-col text-left min-w-0">
              <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-widest mb-0.5">
                Blogger Account
              </span>
              <span className="font-black text-xl text-black tracking-tight leading-tight truncate max-w-[300px]">
                {account.email}
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-background/40">

          {/* Blogs List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/15">
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <span className="text-xs font-bold tracking-tight text-black/70">
                Blogs
              </span>
              {!loadingBlogs && !error && (
                <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full font-medium">
                  {blogs.length}
                </span>
              )}
            </div>

            {loadingBlogs ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border border-border/40 rounded-xl space-y-2">
                    <Skeleton className="h-4 w-40 rounded" />
                    <Skeleton className="h-3 w-56 rounded" />
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-red-600">Failed to load blogs</p>
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              </div>
            ) : blogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Globe className="w-8 h-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground font-medium">No blogs found</p>
              </div>
            ) : (
              <div className="flex flex-col -space-y-px">
                {blogs.map((blog, index) => {
                  const isExpanded = expandedBlogId === blog.id;
                  return (
                    <div
                      key={blog.id}
                      onClick={() => setExpandedBlogId(isExpanded ? null : blog.id)}
                      className={`group/blog p-4 bg-card/60 border border-border/40 hover:bg-emerald-500/5 transition-all duration-200 cursor-pointer relative hover:z-10 ${
                        index === 0 ? 'rounded-t-xl' : ''
                      } ${
                        index === blogs.length - 1 ? 'rounded-b-xl' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="size-8 bg-emerald-500/10 rounded-lg border border-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                            <Globe className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-black tracking-tight truncate pr-2">
                              {blog.name}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors truncate" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(blog.id); toast.success(`Blog ID copied to clipboard`); }}>
                                ID: {blog.id}
                              </p>
                              <div className="flex items-center gap-1 text-[11px] text-emerald-600 shrink-0 font-medium">
                                <BookOpen className="w-3 h-3" />
                                <span>{blog.posts?.totalItems ?? 0} posts</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={blog.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border/40 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="min-w-0">
                                <p className="font-medium text-foreground mb-0.5 text-xs capitalize">Blog ID</p>
                                <p className="text-xs text-muted-foreground hover:text-emerald-600 cursor-pointer transition-colors truncate" onClick={() => { navigator.clipboard.writeText(blog.id); toast.success(`Blog ID copied to clipboard`); }}>{blog.id}</p>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground mb-0.5 text-xs capitalize">Address</p>
                                <a href={blog.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{blog.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</a>
                              </div>
                            </div>
                            {blog.description && (
                              <div>
                                <p className="font-medium text-foreground mb-1 text-xs capitalize">Description</p>
                                <p className="text-xs leading-relaxed">{blog.description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              {blog.published && (
                                <div>
                                  <p className="font-medium text-foreground mb-0.5 text-xs capitalize">Published</p>
                                  <p className="text-xs flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(blog.published)}
                                  </p>
                                </div>
                              )}
                              {blog.updated && (
                                <div>
                                  <p className="font-medium text-foreground mb-0.5 text-xs capitalize">Last updated</p>
                                  <p className="text-xs flex items-center gap-1.5">
                                    <Clock className="w-3 h-3" />
                                    {formatDate(blog.updated)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </SheetContent>
  )
}

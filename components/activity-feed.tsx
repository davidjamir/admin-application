"use client"

import { CheckCircle2, Clock, XCircle } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "social",
    status: "success",
    message: "Post 'New Tech Trends' published to 5 pages",
    time: "2 mins ago",
  },
  {
    id: 2,
    type: "crawl",
    status: "loading",
    message: "Crawling 'TechCrunch' for new articles...",
    time: "Just now",
  },
  {
    id: 3,
    type: "news",
    status: "error",
    message: "Failed to process article #8291: Image missing",
    time: "15 mins ago",
  },
  {
    id: 4,
    type: "system",
    status: "success",
    message: "Redis cache flushed successfully",
    time: "1 hour ago",
  },
]

export function ActivityFeed() {
  return (
    <div className="space-y-6">
      {activities.map((item) => (
        <div key={item.id} className="flex items-start gap-4">
          <div className="mt-1">
            {item.status === "success" && (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            )}
            {item.status === "loading" && (
              <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
            )}
            {item.status === "error" && (
              <XCircle className="h-5 w-5 text-destructive" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium leading-none">{item.message}</p>
            <p className="text-xs text-muted-foreground">{item.time}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

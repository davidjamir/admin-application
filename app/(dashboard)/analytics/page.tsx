import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            <BarChart3 className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Traffic Analytics</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              View your detailed analytics and audience insights.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
          <CardDescription>Performance metrics across websites and satellite networks.</CardDescription>
        </CardHeader>
        <CardContent className="py-12 flex flex-col items-center justify-center text-center space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">Analytics Module</h2>
          <p className="text-sm text-muted-foreground">
            Detailed metrics and live traffic data will be integrated here.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

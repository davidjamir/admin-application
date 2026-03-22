import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarClock } from "lucide-react"

export default function SchedulesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Content & Schedules</h1>
        <p className="text-muted-foreground mt-2">
          Manage your universal posting calendar, content libraries, and automated queues.
        </p>
      </div>

      <Card className="flex flex-col items-center justify-center py-32 bg-muted/10 border-dashed">
        <CalendarClock className="h-16 w-16 text-muted-foreground opacity-20 mb-6" />
        <h3 className="text-2xl font-semibold">Calendar UI Pending</h3>
        <p className="text-muted-foreground max-w-md text-center mt-3">
          This sections is ready for the Schedule Builder. You can integrate FullCalendar or custom timeline charts here to orchestrate content distribution across all satellite pages.
        </p>
      </Card>
    </div>
  )
}

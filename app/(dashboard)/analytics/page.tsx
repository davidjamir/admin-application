import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Analytics</CardTitle>
        <CardDescription>View your detailed analytics and insights.</CardDescription>
      </CardHeader>
      <CardContent className="mt-8 flex flex-col items-center justify-center text-center space-y-3">
        <h2 className="text-2xl font-bold tracking-tight">Hello Analytics</h2>
        <p className="text-muted-foreground">
          This page content will be implemented soon by 7 Forge Inc.
        </p>
      </CardContent>
    </Card>
  )
}

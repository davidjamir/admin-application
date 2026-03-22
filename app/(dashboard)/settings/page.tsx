import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Manage your account settings and preferences.</CardDescription>
      </CardHeader>
      <CardContent className="mt-8 flex flex-col items-center justify-center text-center space-y-3">
        <h2 className="text-2xl font-bold tracking-tight">Hello Settings</h2>
        <p className="text-muted-foreground">
          This page content will be implemented soon by 7 Forge Inc.
        </p>
      </CardContent>
    </Card>
  )
}

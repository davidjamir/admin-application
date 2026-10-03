import { getServerSession } from "@/lib/auth/session"
import { SettingsView } from "@/components/settings-view"
import { redirect } from "next/navigation"
import { Settings } from "lucide-react"

export default async function SettingsPage() {
  const user = await getServerSession()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            <Settings className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your account settings, security credentials, appearance, and system preferences.
            </p>
          </div>
        </div>
      </div>
      <SettingsView user={user} />
    </div>
  )
}

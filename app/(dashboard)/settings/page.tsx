import { getServerSession } from "@/lib/auth/session"
import { SettingsForm } from "@/components/settings-form"
import { redirect } from "next/navigation"

export default async function SettingsPage() {
  const user = await getServerSession()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-full xl:col-span-4">
          <SettingsForm user={user} />
        </div>
      </div>
    </div>
  )
}

import { R2SyncView } from "@/components/r2-sync/R2SyncView"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "R2 Sync Manager | Admin Application",
  description: "Synchronize database configuration, ads.txt, sitemaps, and feeds to Cloudflare R2",
}

export default function R2SyncPage() {
  return <R2SyncView />
}

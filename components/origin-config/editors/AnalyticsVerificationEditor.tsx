"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OriginDocument } from "@/types/origin"

export function AnalyticsVerificationEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const analytics = origin.analytics ?? {}
  const verification = origin.verification ?? {}

  const updateAnalytics = (partial: Partial<NonNullable<OriginDocument["analytics"]>>) => {
    onChange((prev) => ({
      ...prev,
      analytics: {
        ...(prev.analytics ?? {}),
        ...partial,
      },
    }))
  }

  const updateVerification = (partial: Partial<NonNullable<OriginDocument["verification"]>>) => {
    onChange((prev) => ({
      ...prev,
      verification: {
        ...(prev.verification ?? {}),
        ...partial,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Analytics Section */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Tracking IDs
        </span>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Google Analytics (GA4 ID)</Label>
            <Input
              value={analytics.gaId ?? ""}
              onChange={(e) => updateAnalytics({ gaId: e.target.value })}
              className="font-mono text-xs"
              placeholder="G-WL3GT21J1R"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Google Tag Manager (GTM ID)</Label>
            <Input
              value={analytics.gtmId ?? ""}
              onChange={(e) => updateAnalytics({ gtmId: e.target.value })}
              className="font-mono text-xs"
              placeholder="GTM-XXXXXXX"
            />
          </div>
        </div>
      </div>

      {/* Verification Section */}
      <div className="space-y-3 border-t pt-4">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Search Engine Verification
        </span>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Google Site Verification</Label>
            <Input
              value={verification.google ?? ""}
              onChange={(e) => updateVerification({ google: e.target.value })}
              className="font-mono text-xs"
              placeholder="google-site-verification token..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Yandex Verification</Label>
            <Input
              value={verification.yandex ?? ""}
              onChange={(e) => updateVerification({ yandex: e.target.value })}
              className="font-mono text-xs"
              placeholder="yandex-verification code..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Yahoo Verification</Label>
            <Input
              value={verification.yahoo ?? ""}
              onChange={(e) => updateVerification({ yahoo: e.target.value })}
              className="font-mono text-xs"
              placeholder="yahoo-verification code..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Other (other.me)</Label>
            <Input
              value={verification.other?.me ?? ""}
              onChange={(e) =>
                updateVerification({
                  other: {
                    ...(verification.other ?? {}),
                    me: e.target.value,
                  },
                })
              }
              className="font-mono text-xs"
              placeholder="custom token..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}

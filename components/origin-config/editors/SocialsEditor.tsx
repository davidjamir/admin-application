"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { OriginDocument, OriginSocials } from "@/types/origin"

const SOCIAL_PLATFORMS: Array<{
  key: keyof OriginSocials
  label: string
  placeholder: string
}> = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/..." },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
  { key: "threads", label: "Threads", placeholder: "https://threads.net/..." },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/..." },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/..." },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/..." },
  { key: "reddit", label: "Reddit", placeholder: "https://reddit.com/..." },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/..." },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/..." },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/..." },
  { key: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/..." },
  { key: "twitch", label: "Twitch", placeholder: "https://twitch.tv/..." },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/..." },
]

export function SocialsEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const socials = origin.socials ?? {}

  const handleUpdate = (key: keyof OriginSocials, value: string) => {
    onChange((prev) => ({
      ...prev,
      socials: {
        ...(prev.socials ?? {}),
        [key]: value,
      },
    }))
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {SOCIAL_PLATFORMS.map((platform) => {
        const val = socials[platform.key] ?? ""
        return (
          <div key={platform.key} className="space-y-1">
            <Label className="text-xs font-semibold text-muted-foreground">{platform.label}</Label>
            <Input
              value={val}
              onChange={(e) => handleUpdate(platform.key, e.target.value)}
              placeholder={platform.placeholder}
              className="text-xs font-mono h-8"
            />
          </div>
        )
      })}
    </div>
  )
}

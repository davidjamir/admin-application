"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { OriginDocument } from "@/types/origin"
import { Sparkles, Copy, Check } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function AdsTxtEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const [copied, setCopied] = useState(false)
  const adsTxt = origin.ads?.adsTxt ?? ""

  const lineCount = adsTxt ? adsTxt.split("\n").length : 0
  const charCount = adsTxt.length

  const handleCleanEmptyLines = () => {
    const cleaned = adsTxt
      .split("\n")
      .map((line) => line.trim())
      .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
      .join("\n")
    onChange((prev) => ({
      ...prev,
      ads: {
        ...(prev.ads ?? {}),
        adsTxt: cleaned,
      },
    }))
    toast.success("Blank lines removed")
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(adsTxt)
    setCopied(true)
    toast.success("ads.txt copied")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>{lineCount.toLocaleString()} lines</span>
          <span>·</span>
          <span>{charCount.toLocaleString()} chars</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCleanEmptyLines}
            className="h-8 text-xs"
          >
            <Sparkles className="size-3.5" />
            Clean Lines
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 text-xs"
          >
            {copied ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <Textarea
        id="ads-txt"
        value={adsTxt}
        onChange={(e) =>
          onChange((prev) => ({
            ...prev,
            ads: {
              ...(prev.ads ?? {}),
              adsTxt: e.target.value,
            },
          }))
        }
        className="h-[520px] max-h-[640px] w-full resize-y font-mono text-xs leading-relaxed"
        placeholder={`google.com, pub-xxxxxxxx, DIRECT, f08c47fec0942fa0`}
      />
    </div>
  )
}

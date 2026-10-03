"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { OriginDocument } from "@/types/origin"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Eraser,
  Filter,
  Pencil,
  ScanSearch,
  Sparkles,
  Trash2,
} from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"

interface DuplicateInfo {
  content: string
  indices: number[] // 0-indexed line numbers
  firstIndex: number
}

export function AdsTxtEditor({
  origin,
  onChange,
}: {
  origin: OriginDocument
  onChange: (updater: (prev: OriginDocument) => OriginDocument) => void
}) {
  const [copied, setCopied] = useState(false)
  const [checkDupes, setCheckDupes] = useState(false)
  const [onlyShowDupes, setOnlyShowDupes] = useState(false)
  const [focusedDupeIdx, setFocusedDupeIdx] = useState(0)

  const rowRefs = useRef<Record<number, HTMLTableRowElement | null>>({})

  const adsTxt = origin.ads?.adsTxt ?? ""
  const lines = useMemo(() => adsTxt.split("\n"), [adsTxt])
  const lineCount = lines.length
  const charCount = adsTxt.length

  // Build a map of trimmed line contents to their duplicate line indices
  const duplicateMap = useMemo(() => {
    const map = new Map<string, number[]>()
    lines.forEach((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) return
      const existing = map.get(trimmed)
      if (existing) {
        existing.push(idx)
      } else {
        map.set(trimmed, [idx])
      }
    })

    const dupes = new Map<string, DuplicateInfo>()
    for (const [content, indices] of map.entries()) {
      if (indices.length > 1) {
        dupes.set(content, { content, indices, firstIndex: indices[0] })
      }
    }
    return dupes
  }, [lines])

  // Flat list of all line indices that are duplicates (in order)
  const duplicateLineIndices = useMemo(() => {
    const result: number[] = []
    lines.forEach((line, idx) => {
      if (duplicateMap.has(line.trim())) {
        result.push(idx)
      }
    })
    return result
  }, [lines, duplicateMap])

  const totalDuplicateLines = duplicateLineIndices.length
  const uniqueDuplicateGroups = duplicateMap.size

  // Scroll to a duplicate line
  const jumpToDuplicate = (newIndex: number) => {
    if (duplicateLineIndices.length === 0) return
    const safeIdx =
      (newIndex + duplicateLineIndices.length) % duplicateLineIndices.length
    setFocusedDupeIdx(safeIdx)
    const lineIndex = duplicateLineIndices[safeIdx]
    const targetEl = rowRefs.current[lineIndex]
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  // Deduplicate action: Keep first occurrence of each unique line, remove subsequent duplicates
  const handleDeduplicate = () => {
    const seen = new Set<string>()
    const newLines: string[] = []
    let removedCount = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) {
        newLines.push(line)
        continue
      }
      if (seen.has(trimmed)) {
        removedCount++
        continue
      }
      seen.add(trimmed)
      newLines.push(line)
    }

    if (removedCount === 0) {
      toast.info("No duplicate lines found")
      return
    }

    const updated = newLines.join("\n")
    onChange((prev) => ({
      ...prev,
      ads: { ...(prev.ads ?? {}), adsTxt: updated },
    }))
    toast.success(
      `Removed ${removedCount} duplicate ${
        removedCount === 1 ? "line" : "lines"
      } (kept first occurrence)`
    )
  }

  // Delete a specific line
  const handleDeleteLine = (targetIdx: number) => {
    const newLines = lines.filter((_, idx) => idx !== targetIdx)
    onChange((prev) => ({
      ...prev,
      ads: { ...(prev.ads ?? {}), adsTxt: newLines.join("\n") },
    }))
    toast.success(`Deleted line #${targetIdx + 1}`)
  }

  // Remove consecutive blank lines
  const handleRemoveBlankLines = () => {
    const cleaned = lines
      .map((line) => line.trim())
      .filter((line, i, arr) => line !== "" || (i > 0 && arr[i - 1] !== ""))
      .join("\n")
    onChange((prev) => ({
      ...prev,
      ads: { ...(prev.ads ?? {}), adsTxt: cleaned },
    }))
    toast.success("Consecutive redundant blank lines removed")
  }

  // Copy ads.txt
  const handleCopy = () => {
    navigator.clipboard.writeText(adsTxt)
    setCopied(true)
    toast.success("Ads.txt copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex h-full flex-col gap-3 min-h-0">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>{lineCount.toLocaleString()} lines</span>
          <span>·</span>
          <span>{charCount.toLocaleString()} chars</span>
          {totalDuplicateLines > 0 ? (
            <>
              <span>·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                <AlertTriangle className="size-3.5" />
                {totalDuplicateLines} duplicate lines ({uniqueDuplicateGroups} unique)
              </span>
            </>
          ) : (
            <>
              <span>·</span>
              <span className="text-emerald-600 dark:text-emerald-400">
                ✓ No duplicates
              </span>
            </>
          )}
        </div>

        <div className="flex items-center flex-wrap gap-1.5">
          {/* Check duplicates toggle */}
          <Button
            type="button"
            variant={checkDupes ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setCheckDupes((v) => !v)
              if (!checkDupes) setFocusedDupeIdx(0)
            }}
            className="h-8 text-xs font-medium"
            title="Toggle duplicate checking and highlighting"
          >
            {checkDupes ? (
              <>
                <Pencil className="size-3.5 mr-1" />
                Edit Mode
              </>
            ) : (
              <>
                <ScanSearch className="size-3.5 mr-1" />
                Check Duplicates {totalDuplicateLines > 0 ? `(${totalDuplicateLines})` : ""}
              </>
            )}
          </Button>

          {/* Deduplicate button if duplicates exist */}
          {totalDuplicateLines > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDeduplicate}
              className="h-8 text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10 font-medium"
              title="Keep the first occurrence and remove all redundant duplicate lines"
            >
              <Sparkles className="size-3.5 mr-1" />
              Deduplicate
            </Button>
          )}

          {/* Clean lines / remove blank lines */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemoveBlankLines}
            className="h-8 text-xs"
            title="Remove consecutive redundant blank lines and trim edges"
          >
            <Eraser className="size-3.5 mr-1" />
            Clean Blank Lines
          </Button>

          {/* Copy */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-8 text-xs"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500 mr-1" />
            ) : (
              <Copy className="size-3.5 mr-1" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Duplicate Checker View Controls Bar (only shown when checkDupes is active) */}
      {checkDupes && (
        <div className="flex items-center justify-between gap-2 rounded-lg border bg-amber-500/10 px-3 py-2 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-amber-700 dark:text-amber-300">
              Duplicate Inspector:
            </span>
            <span className="text-muted-foreground">
              {totalDuplicateLines > 0
                ? `Found ${totalDuplicateLines} duplicate lines highlighted in soft yellow.`
                : "All lines are unique, no duplicates found!"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {totalDuplicateLines > 0 && (
              <>
                {/* Filter toggle: all vs duplicates only */}
                <Button
                  type="button"
                  size="sm"
                  variant={onlyShowDupes ? "default" : "secondary"}
                  onClick={() => setOnlyShowDupes((v) => !v)}
                  className="h-7 text-xs px-2.5"
                >
                  <Filter className="size-3 mr-1" />
                  {onlyShowDupes ? "Show All Lines" : `Only Duplicates (${totalDuplicateLines})`}
                </Button>

                {/* Jump between duplicates */}
                <div className="flex items-center border rounded-md bg-background px-1 h-7">
                  <span className="text-[11px] font-mono px-1.5 text-muted-foreground">
                    {focusedDupeIdx + 1}/{totalDuplicateLines}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => jumpToDuplicate(focusedDupeIdx - 1)}
                    title="Previous duplicate line"
                  >
                    <ChevronUp className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => jumpToDuplicate(focusedDupeIdx + 1)}
                    title="Next duplicate line"
                  >
                    <ChevronDown className="size-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {checkDupes ? (
        /* ── Read-only Duplicate Highlight Table with Adaptive Theme ── */
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-card font-mono text-xs leading-relaxed shadow-inner">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => {
                const trimmed = line.trim()
                const dupeInfo = duplicateMap.get(trimmed)
                const isDupe = Boolean(dupeInfo)
                const isFirst = dupeInfo ? dupeInfo.firstIndex === idx : false

                // If filter "only duplicates" is enabled, hide non-duplicate rows
                if (onlyShowDupes && !isDupe) {
                  return null
                }

                const isCurrentFocused =
                  duplicateLineIndices[focusedDupeIdx] === idx

                return (
                  <tr
                    key={idx}
                    ref={(el) => {
                      rowRefs.current[idx] = el
                    }}
                    className={`group transition-colors border-b border-border/30 last:border-b-0 ${
                      isDupe
                        ? isCurrentFocused
                          ? "bg-amber-300/40 dark:bg-amber-500/30 border-l-4 border-l-amber-600"
                          : "bg-amber-100/70 dark:bg-amber-500/15 border-l-4 border-l-amber-500/70 hover:bg-amber-200/50 dark:hover:bg-amber-500/25"
                        : "border-l-4 border-l-transparent hover:bg-muted/40"
                    }`}
                  >
                    {/* Line number */}
                    <td className="select-none w-12 shrink-0 border-r border-border/40 px-2 py-1 text-right text-muted-foreground/60 align-top">
                      {idx + 1}
                    </td>

                    {/* Line text */}
                    <td
                      className={`px-3 py-1 whitespace-pre-wrap break-all align-top ${
                        isDupe
                          ? "text-amber-950 dark:text-amber-200 font-medium"
                          : "text-foreground/90"
                      }`}
                    >
                      <span>{line || "\u00A0"}</span>
                    </td>

                    {/* Metadata & Actions */}
                    <td className="w-48 shrink-0 px-2 py-1 text-right align-top select-none">
                      {dupeInfo && (
                        <div className="flex items-center justify-end gap-1.5">
                          {isFirst ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-sans border-amber-500/50 bg-amber-500/20 text-amber-800 dark:text-amber-300 font-medium"
                              title={`Appears ${dupeInfo.indices.length} times on lines: ${dupeInfo.indices.map((i) => i + 1).join(", ")}`}
                            >
                              Original ({dupeInfo.indices.length}x)
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-[10px] font-sans border-amber-600/40 bg-amber-600/15 text-amber-800 dark:text-amber-300 font-normal"
                              title={`Matches line #${dupeInfo.firstIndex + 1}`}
                            >
                              Duplicate of #{dupeInfo.firstIndex + 1}
                            </Badge>
                          )}

                          {/* Quick delete this line */}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLine(idx)}
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-70 group-hover:opacity-100 transition-opacity"
                            title={`Delete line #${idx + 1}`}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ── Standard Editable Textarea ── */
        <Textarea
          id="ads-txt"
          value={adsTxt}
          onChange={(e) =>
            onChange((prev) => ({
              ...prev,
              ads: { ...(prev.ads ?? {}), adsTxt: e.target.value },
            }))
          }
          className="flex-1 min-h-0 w-full resize-none font-mono text-xs leading-relaxed overflow-y-auto"
          placeholder="google.com, pub-xxxxxxxx, DIRECT, f08c47fec0942fa0"
          spellCheck={false}
        />
      )}
    </div>
  )
}

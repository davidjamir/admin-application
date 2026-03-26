import React from "react"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectionShortcutsProps {
  selectedInBmCount: number
  activePart: number | null
  handleSelectThird: (part: 1 | 2 | 3) => void
  onClear: () => void
}

export function SelectionShortcuts({
  selectedInBmCount, activePart, handleSelectThird, onClear
}: SelectionShortcutsProps) {
  return (
    <div className="p-3 border-b border-border/30 bg-muted/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-primary tracking-wide">
                {selectedInBmCount} items selected in this node
            </span>
        </div>
        <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground/50 mr-1 capitalize tracking-tighter">Shortcuts:</span>
            {[1, 2, 3].map((part) => (
                <Button
                    key={part}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSelectThird(part as 1 | 2 | 3)}
                    className={cn(
                        "h-7 px-2.5 text-[10px] font-bold transition-all rounded-lg cursor-pointer",
                        activePart === part 
                            ? "border-green-600 text-green-600 bg-green-50" 
                            : "border-border/50 hover:border-primary/40 hover:bg-primary/5"
                    )}
                >
                    {part}/3
                </Button>
            ))}
            <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-7 px-1.5 text-red-600 border-red-600 hover:text-red-600 hover:bg-red-600/10 transition-all rounded-lg ml-0.5 cursor-pointer"
            >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                <span className="text-[10px] font-bold">Clear</span>
            </Button>
        </div>
    </div>
  )
}

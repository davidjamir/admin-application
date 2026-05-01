import React, { useState } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MongoPageData } from "@/hooks/useFacebookPages"

interface DeletePageDialogProps {
  page: MongoPageData
  onDelete: (page: MongoPageData) => Promise<void>
  triggerSize?: React.ComponentProps<typeof Button>["size"]
  triggerClassName?: string
  triggerLabel?: string
}

export const DeletePageDialog: React.FC<DeletePageDialogProps> = ({
  page,
  onDelete,
  triggerSize = "icon-xs",
  triggerClassName = "",
  triggerLabel,
}) => {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirmDelete = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDeleting(true)

    try {
      await onDelete(page)
      setOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={triggerSize}
          className={`cursor-pointer text-muted-foreground hover:text-destructive ${triggerClassName}`}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
          aria-label={`Delete ${page.name}`}
          title="Delete page"
        >
          <Trash2 data-icon="inline-start" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent onClick={(event) => event.stopPropagation()}>
        <form onSubmit={handleConfirmDelete}>
          <DialogHeader>
            <DialogTitle>Delete this page?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{page.name}</span> from the database? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="cursor-pointer" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" className="cursor-pointer" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

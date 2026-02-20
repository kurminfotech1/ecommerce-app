import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteModal({
  onConfirm,
  parentTitle,
  childTitle,
  open,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  parentTitle?: string;
  childTitle?: string;
  open?: boolean;
  onClose?: () => void;
  loading?: boolean;
}) {
  const isControlled = typeof open === "boolean";

  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && onClose?.()}>
      {!isControlled && (
        <AlertDialogTrigger asChild>
          <button className="p-2 hover:bg-red-100 rounded-lg text-red-600">
            <Trash2 size={18} />
          </button>
        </AlertDialogTrigger>
      )}

      <AlertDialogContent size="md">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>

          <AlertDialogTitle>{parentTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {childTitle}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel variant="outline" disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={(e) => {
              if (isControlled) {
                e.preventDefault();
              }
              onConfirm();
            }}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

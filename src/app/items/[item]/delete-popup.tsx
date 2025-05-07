import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useCallback } from "react";
import { toast } from "sonner";

export const DeleteForm = ({
  itemId,
  isOpen = false,
  onClose,
  onDelete,
}: {
  itemId: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
}) => {
  const deleteMutation = api.items.delete.useMutation({
    onSuccess: () => {
      onDelete();
      toast.success("Item deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete item:", error);
      toast.error("Failed to delete item");
    },
  });

  const handleDelete = useCallback(async () => {
    deleteMutation.mutate({ itemId });
  }, [itemId, deleteMutation]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
        </DialogHeader>
        Are you sure you want to delete this item? This action cannot be undone.
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

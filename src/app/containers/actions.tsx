"use client";

import { api } from "@/trpc/react";
import { useCallback } from "react";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBoolean } from "@/hooks/use-boolean";
import { DeleteContainer } from "./delete-container";
import { MoveItems } from "./move-items";
import type { DirectoryNode } from "@/types/dto";
import { AddContainer } from "./add-container";

export const ContainerActions = ({ tree }: { tree: DirectoryNode }) => {
  const utils = api.useUtils();
  const router = useRouter();
  const {
    value: isDeleteOpen,
    setFalse: closeDeleteForm,
    setTrue: openDeleteForm,
  } = useBoolean(false);
  const {
    value: isMoveOpen,
    setFalse: closeMoveForm,
    setTrue: openMoveForm,
  } = useBoolean(false);
  const {
    value: isAddOpen,
    setFalse: closeAddForm,
    setTrue: openAddForm,
  } = useBoolean(false);

  const handleDelete = useCallback(() => {
    closeDeleteForm();
    router.push(`/containers`);
    toast.success("Container deleted successfully!");
    void utils.containers.getDirectoryTree.invalidate({
      containerId: tree.parent.id,
    });
    void utils.items.getAll.invalidate({ containerId: tree.parent.id });
  }, [closeDeleteForm, router, tree.parent.id, utils]);

  const handleItemsMoved = useCallback(() => {
    closeMoveForm();
    router.push(`/containers/${tree.parent.id}`);
    toast.success("Items moved successfully!");
    void utils.containers.getDirectoryTree.invalidate({
      containerId: tree.parent.id,
    });
    void utils.items.getAll.invalidate({ containerId: tree.parent.id });

    for (const item of tree.items ?? []) {
      void utils.items.getAll.invalidate({ containerId: item.containerId });
    }
  }, [closeMoveForm, tree.parent.id, router, utils, tree.items]);

  const handleAdded = useCallback(() => {
    closeAddForm();
    toast.success("Container created successfully!");
    void utils.containers.getDirectoryTree.invalidate({
      containerId: tree.parent.id,
    });
  }, [closeAddForm, tree.parent.id, utils]);

  return (
    <>
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-2xl">Container Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              onClick={openAddForm}
              className="overflow-hidden text-wrap text-ellipsis"
            >
              Add Container
            </Button>
            <Button
              variant="secondary"
              disabled={tree?.items?.length === 0}
              onClick={openMoveForm}
              className="overflow-hidden text-wrap text-ellipsis"
            >
              Move Items {tree.items?.length === 0 && "(No items to move)"}
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={openDeleteForm}
              disabled={tree.parent.path === "/"}
            >
              Delete {tree.parent.path === "/" && "(Cannot delete Root)"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <DeleteContainer
        isOpen={isDeleteOpen}
        onClose={closeDeleteForm}
        onDelete={handleDelete}
        containerId={tree.parent.id}
        hasItems={(tree.items?.length ?? 0) > 0}
      />
      <MoveItems
        isOpen={isMoveOpen}
        containerId={tree.parent.id}
        onClose={closeMoveForm}
        onMove={handleItemsMoved}
      />

      <AddContainer
        isOpen={isAddOpen}
        onClose={closeAddForm}
        onAdded={handleAdded}
        basePathname={tree.parent.path}
      />
    </>
  );
};

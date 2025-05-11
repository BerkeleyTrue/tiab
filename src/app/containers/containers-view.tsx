"use client";

import { api } from "@/trpc/react";
import { useCallback, useEffect } from "react";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ItemsTable } from "../items";
import { toast } from "sonner";
import { useBoolean } from "@/hooks/use-boolean";
import { DeleteContainer } from "./delete-container";
import { MoveItems } from "./move-items";
import type { DirectoryNode } from "@/types/dto";
import { DirectoryTree } from "./directory-tree";

export const ContainersView = ({ tree }: { tree: DirectoryNode }) => {
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

  useEffect(() => {
    utils.containers.getDirectoryTree.setData(
      { containerId: tree.parent.id },
      tree,
    );
    utils.items.getAll.setData(
      {
        containerId: tree.parent.id,
      },
      tree.items ?? [],
    );
  }, [tree, utils]);

  const { data = tree, isLoading } = api.containers.getDirectoryTree.useQuery({
    containerId: tree.parent.id,
  });

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
    router.push(`/containers/${data.parent.id}`);
    toast.success("Items moved successfully!");
    void utils.containers.getDirectoryTree.invalidate({
      containerId: data.parent.id,
    });
    void utils.items.getAll.invalidate({ containerId: data.parent.id });

    for (const item of data.items ?? []) {
      void utils.items.getAll.invalidate({ containerId: item.containerId });
    }
  }, [closeMoveForm, data.parent.id, router, utils, data.items]);

  if (!data && isLoading) {
    return <div className="flex justify-center p-4">Loading containers...</div>;
  }

  return (
    <div className="grid h-full w-full grid-cols-1 grid-rows-2 gap-2 sm:grid-cols-2 md:grid-cols-3">
      <DirectoryTree tree={data} />
      {data.items && (
        <ItemsTable
          initItems={data.items}
          initContainer={data.parent}
          className="col-span-2"
        />
      )}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-2xl">Container Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              disabled={data?.items?.length === 0}
              onClick={openMoveForm}
              className="overflow-hidden text-wrap text-ellipsis"
            >
              Move Items {data.items?.length === 0 && "(No items to move)"}
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={openDeleteForm}
              disabled={data.parent.path === "/"}
            >
              Delete {data.parent.path === "/" && "(Cannot delete Root)"}
            </Button>
          </div>
        </CardContent>
      </Card>
      <DeleteContainer
        isOpen={isDeleteOpen}
        onClose={closeDeleteForm}
        onDelete={handleDelete}
        containerId={data.parent.id}
        hasItems={(data.items?.length ?? 0) > 0}
      />
      <MoveItems
        isOpen={isMoveOpen}
        containerId={data.parent.id}
        onClose={closeMoveForm}
        onMove={handleItemsMoved}
      />
    </div>
  );
};

"use client";

import { api } from "@/trpc/react";
import { useEffect } from "react";
import { ItemsTable } from "../items";
import type { DirectoryNode } from "@/types/dto";
import { DirectoryTree } from "./directory-tree";
import { ContainerActions } from "./actions";

export const ContainersView = ({ tree }: { tree: DirectoryNode }) => {
  const utils = api.useUtils();

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
      <ContainerActions tree={data} />
    </div>
  );
};

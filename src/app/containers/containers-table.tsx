"use client";

import type { DirectoryNode } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useEffect } from "react";

export const ContainersTable = ({ tree }: {
  tree: DirectoryNode;
}) => {
  const utils = api.useUtils();

  useEffect(() => {
    utils.containers.getDirectoryTree.setData({ path: "/" }, tree);
  }, [tree, utils.containers.getDirectoryTree]);
  
  const { data } = api.containers.getDirectoryTree.useQuery({
    path: "/",
  });

  console.log("ContainersTable", data);

  return <div className="flex justify-center p-4">Loading containers...</div>;
};

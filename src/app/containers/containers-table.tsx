"use client";

import type { DirectoryNode, Item } from "@/server/db/schema";
import { api } from "@/trpc/react";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Package,
  Box,
  Candy,
  PackageOpen,
  SquareArrowOutUpRight,
  Bone,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TreeNodeProps = {
  node: DirectoryNode;
  level: number;
};

const TreeNode = ({ node, level }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const hasItems = node.items && node.items.length > 0;

  const itemCount = useMemo(() => {
    function getChildrenItemCount(children: DirectoryNode[]): number {
      return children.reduce((acc, child) => {
        return (
          acc +
          getChildrenItemCount(child.children) +
          (child.items?.length ?? 0)
        );
      }, 0);
    }

    return (node.items?.length ?? 0) + getChildrenItemCount(node.children);
  }, [node]);

  const toggleExpand = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="w-full">
      <div
        className={cn(
          "flex cursor-pointer items-center rounded-md px-2 py-1",
          level === 0 && "font-semibold",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <div className="flex items-center" onClick={toggleExpand}>
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="mr-1 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-1 h-4 w-4" />
            )
          ) : (
            <span className="w-5" />
          )}

          {isExpanded ? (
            <PackageOpen className="mr-2 h-5 w-5" />
          ) : hasChildren ? (
            <Package className="mr-2 h-5 w-5" />
          ) : (
            <PackageOpen className="mr-2 h-5 w-5" />
          )}
        </div>

        <div className="flex-1 truncate">
          {node.parent.path}
        </div>

        {itemCount > 0 && (
          <Badge variant="secondary" className="mr-2">
            {itemCount} <Candy className="inline-block h-4 w-4" />
          </Badge>
        )}
        {node.children.length > 0 && (
          <Badge variant="secondary" className="mr-2">
            {node.children.length} <Box className="inline-block h-4 w-4" />
          </Badge>
        )}

        <Link href={`/containers/${node.parent.id}`} className="mr-2">
          <SquareArrowOutUpRight className="h-4 w-4" />
        </Link>
      </div>

      {isExpanded && (
        <>
          {hasItems && (
            <div className="ml-8">
              {node.items?.map((item) => (
                <ItemRow key={item.id} item={item} level={level + 1} />
              ))}
            </div>
          )}

          {hasChildren &&
            node.children.map((child, index) => (
              <TreeNode
                key={`${child.parent.id}-${index}`}
                node={child}
                level={level + 1}
              />
            ))}
        </>
      )}
    </div>
  );
};

const ItemRow = ({ item, level }: { item: Item; level: number }) => {
  return (
    <Link
      className="flex items-center rounded-md px-2 py-1"
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      href={`/items/${item.id}`}
    >
      <Bone className="mr-2 h-4 w-4" />
      <span className="truncate">{item.name}</span>
      {(item.count ?? 0) > 1 && (
        <span className="ml-2 rounded-full px-2 py-0.5 text-xs">
          x{item.count}
        </span>
      )}
    </Link>
  );
};

export const ContainersTable = ({ tree }: { tree: DirectoryNode }) => {
  const utils = api.useUtils();

  useEffect(() => {
    utils.containers.getDirectoryTree.setData({ containerId: tree.parent.id }, tree);
  }, [tree, utils.containers.getDirectoryTree]);

  const { data = tree, isLoading } = api.containers.getDirectoryTree.useQuery({
    containerId: tree.parent.id,
  });

  if (!data && isLoading) {
    return <div className="flex justify-center p-4">Loading containers...</div>;
  }

  return (
    <Card className="mx-auto w-full max-w-4xl p-4">
      <CardHeader>
        <CardTitle>Containers</CardTitle>
      </CardHeader>
      <CardContent>
        <TreeNode node={data} level={0} />
      </CardContent>
    </Card>
  );
};

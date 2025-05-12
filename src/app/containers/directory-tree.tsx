"use client";

import type { ItemSelect } from "@/server/db/schema";
import { useMemo, useState } from "react";
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
import { cn, pluralize } from "@/lib/utils";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DirectoryNode } from "@/types/dto";

type TreeNodeProps = {
  node: DirectoryNode;
  level: number;
};

const levelToPadding = (level: number): number => {
  return level * 22;
};

const TreeNode = ({ node, level }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;
  const hasItems = node.items && node.items.length > 0;
  const isRoot = level === 0;
  const items = (node?.items ?? []).slice(0, 4);

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

    return (
      (node.items?.length ?? 0) +
      (isExpanded ? 0 : getChildrenItemCount(node.children))
    );
  }, [node, isExpanded]);

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
        style={{ paddingLeft: `${levelToPadding(level)}px` }}
      >
        <div className="flex items-center" onClick={toggleExpand}>
          {hasChildren || hasItems ? (
            isExpanded ? (
              <ChevronDown className="mr-1 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-1 h-4 w-4" />
            )
          ) : (
            /* Placeholder for icon when no children */
            <span className="w-5" />
          )}

          {isExpanded || !hasChildren ? (
            <PackageOpen className="mr-2 h-5 w-5" />
          ) : (
            <Package className="mr-2 h-5 w-5" />
          )}
        </div>

        <div className="flex-1 truncate" onClick={toggleExpand}>
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

        {!isRoot ? (
          <Link href={`/containers/${node.parent.id}`} className="mr-2">
            <SquareArrowOutUpRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="w-5" />
        )}
      </div>

      {isExpanded && (
        <>
          {hasChildren &&
            node.children.map((child, index) => (
              <TreeNode
                key={`${child.parent.id}-${index}`}
                node={child}
                level={level + 1}
              />
            ))}

          {!isRoot && hasItems && (
            <div className="w-full">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} level={level + 1} />
              ))}
              {items.length < (node.items?.length ?? 0) && (
                <Link
                  className="flex items-center rounded-md px-2 py-1"
                  style={{ paddingLeft: `${levelToPadding(level + 1)}px` }}
                  href={`/containers/${node.parent.id}`}
                >
                  <span className="w-5" />
                  <Bone className="mr-2 h-4 w-4" />
                  <span className="truncate">
                    {(node?.items?.length ?? 0) - items.length} more items...
                  </span>
                  <span className="ml-2 rounded-full px-2 py-0.5 text-xs">
                    x{node?.items?.length ?? 0 - items.length}
                  </span>
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ItemRow = ({ item, level }: { item: ItemSelect; level: number }) => {
  return (
    <Link
      className="flex items-center rounded-md px-2 py-1"
      style={{ paddingLeft: `${levelToPadding(level)}px` }}
      href={`/items/${item.id}`}
    >
      <span className="w-5" />
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

export const DirectoryTree = ({ tree }: { tree: DirectoryNode }) => {
  return (
    <Card className="col-span-2 row-span-2 md:col-span-1 md:p-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center text-2xl">
              Containers
            </CardTitle>
            <CardDescription>
              {tree.parent.path == "/" ? "Root" : tree.parent.path} -
              {tree.children.length > 0
                ? ` ${tree.children.length} ${pluralize(tree.children.length, "container")}`
                : ""}
              {tree?.items?.length
                ? ` ${tree.items?.length ?? 0} ${pluralize(tree.items.length ?? 0, "item")}`
                : ""}
            </CardDescription>
          </div>

          {tree.parent.path !== "/" && (
            <Button variant="secondary" className="mt-2" asChild>
              {tree.parent.parentId === null ? (
                <Link href={`/containers`}>Back</Link>
              ) : (
                <Link href={`/containers/${tree.parent.parentId}`}>Back</Link>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TreeNode node={tree} level={0} />
      </CardContent>
    </Card>
  );
};

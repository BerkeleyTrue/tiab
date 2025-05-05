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
import { useRouter } from "next/navigation";

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
          {hasChildren ? (
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

        <Link href={`/containers/${node.parent.id}`} className="mr-2">
          <SquareArrowOutUpRight className="h-4 w-4" />
        </Link>
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

          {hasItems && (
            <div className="w-full">
              {node.items?.map((item) => (
                <ItemRow key={item.id} item={item} level={level + 1} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const ItemRow = ({ item, level }: { item: Item; level: number }) => {
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

export const ContainersTable = ({ tree }: { tree: DirectoryNode }) => {
  const utils = api.useUtils();
  const router = useRouter();

  useEffect(() => {
    utils.containers.getDirectoryTree.setData(
      { containerId: tree.parent.id },
      tree,
    );
  }, [tree, utils.containers.getDirectoryTree]);

  const { data = tree, isLoading } = api.containers.getDirectoryTree.useQuery({
    containerId: tree.parent.id,
  });

  if (!data && isLoading) {
    return <div className="flex justify-center p-4">Loading containers...</div>;
  }

  return (
    <Card className="mx-auto w-full max-w-4xl md:p-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center text-2xl">
              Containers
            </CardTitle>
            <CardDescription>
              {data.parent.path == "/" ? "Root" : data.parent.path} -
              {data.children.length > 0
                ? ` ${data.children.length} ${pluralize(data.children.length, "container")}`
                : ""}
              {data?.items?.length
                ? ` ${data.items?.length ?? 0} ${pluralize(data.items.length ?? 0, "item")}`
                : ""}
            </CardDescription>
          </div>

          {data.parent.path !== "/" && (
            <Button
              variant="secondary"
              className="mt-2"
              onClick={() => router.back()}
            >
              Back
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TreeNode node={data} level={0} />
      </CardContent>
    </Card>
  );
};

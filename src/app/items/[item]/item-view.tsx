"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Calendar, Clock, PackageOpen, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { AddItemForm } from "@/app/add-item";
import type { ItemWithPathname } from "@/server/db/schema";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useBoolean } from "@/hooks/use-boolean";

export const ItemView = ({ item }: { item: ItemWithPathname }) => {
  const {
    value: isAddItemOpen,
    setTrue: openAddItem,
    setFalse: closeAddItem,
  } = useBoolean();

  return (
    <Card>
      <AddItemForm isOpen={isAddItemOpen} onClose={closeAddItem} />
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center text-2xl">
              <Package className="mr-2 h-6 w-6" />
              {item.name}
              <Button variant="ghost" onClick={openAddItem}>
                <Edit className="h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>
              Located in:{" "}
              <Link
                href={`/containers/${item.containerId}`}
                className="hover:underline"
              >
                {item.pathname}
              </Link>
            </CardDescription>
          </div>

          {(item.count ?? 0) > 1 && (
            <Badge variant="secondary" className="mr-4 px-3 py-1 text-lg">
              x{item.count}
            </Badge>
          )}

          <Button variant="outline" asChild>
            <Link href={`/containers/${item.containerId}`}>
              <PackageOpen className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {item.description ? (
          <div className="prose dark:prose-invert max-w-none">
            <h3>Description</h3>
            <p>{item.description}</p>
          </div>
        ) : (
          <p className="text-muted-foreground italic">
            No description provided
          </p>
        )}
      </CardContent>

      <CardFooter className="text-muted-foreground flex justify-between text-sm">
        <div className="flex items-center">
          <Calendar className="mr-1 h-4 w-4" />
          Created{" "}
          {formatDistanceToNow(new Date(item.createdAt), {
            addSuffix: true,
          })}
        </div>
        {item.updatedAt && (
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            Updated{" "}
            {formatDistanceToNow(new Date(item.updatedAt), {
              addSuffix: true,
            })}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

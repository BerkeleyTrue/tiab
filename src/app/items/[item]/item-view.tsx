"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Calendar,
  Clock,
  PackageOpen,
  Edit,
  BookOpen,
  Bomb,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ItemWithPathname } from "@/server/db/schema";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DeleteForm } from "./delete-popup";
import { useBoolean } from "@/hooks/use-boolean";
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/trpc/react";

export const ItemView = ({ item }: { item: ItemWithPathname }) => {
  const utils = api.useUtils();
  const router = useRouter();

  useEffect(() => {
    void utils.items.getById.setData({ itemId: item.id }, item);
  }, [utils, item]);

  const {
    value: isDeleteOpen,
    setFalse: closeDeleteForm,
    setTrue: openDeleteForm,
  } = useBoolean(false);

  const handleDelete = useCallback(() => {
    closeDeleteForm();
    toast.success("Item deleted successfully");
    router.push(`/containers/${item.containerId}`);
    void utils.items.getById.invalidate({ itemId: item.id });
    void utils.items.getAll.invalidate({ containerId: item.containerId });
  }, [closeDeleteForm, item.containerId, router, item.id, utils]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Package className="size-6" />
            <span className="">{item.name}</span>

            {(item.count ?? 0) > 1 && (
              <Badge variant="secondary" className="size-8">
                x{item.count}
              </Badge>
            )}
            {item.isPublic && (
              <Badge variant="outline" className="size-8">
                <BookOpen className="size-4" />
              </Badge>
            )}
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
          <CardAction className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/items/${item.id}/edit`}>
                <Edit className="size-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/containers/${item.containerId}`}>
                <PackageOpen className="size-4" />
              </Link>
            </Button>
            <Button variant="destructive" onClick={openDeleteForm}>
              <Bomb className="size-4" />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {item.description ? (
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-md font-bold">Description</h3>
              <p>{item.description}</p>
            </div>
          ) : (
            <p className="text-muted-foreground italic">
              No description provided
            </p>
          )}
        </CardContent>

        <CardFooter className="text-muted-foreground flex justify-between text-sm">
          <div className="flex gap-2">
            <Calendar className="size-4" />
            {`Created ${formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}`}
          </div>
          {item.updatedAt && (
            <div className="flex gap-2">
              <Clock className="size-4" />
              {`Updated ${formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}`}
            </div>
          )}
        </CardFooter>
      </Card>
      <DeleteForm
        isOpen={isDeleteOpen}
        itemId={item.id}
        onDelete={handleDelete}
        onClose={closeDeleteForm}
      />
    </>
  );
};

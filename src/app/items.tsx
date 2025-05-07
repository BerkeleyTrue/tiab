"use client";

import { useEffect, useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";

import { api } from "@/trpc/react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Container, ItemWithPathname } from "@/server/db/schema";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddItemForm } from "./add-item";
import { format } from "date-fns";
import { useBoolean } from "@/hooks/use-boolean";
import { Edit } from "lucide-react";
import Link from "next/link";
import { pluralize } from "@/lib/utils";

export const ItemsTable = ({
  initItems,
  initContainer,
}: {
  initItems: ItemWithPathname[];
  initContainer?: Container;
}) => {
  const utils = api.useUtils();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const {
    value: isAddItemOpen,
    setTrue: openAddItem,
    setFalse: closeAddItem,
  } = useBoolean();

  useEffect(() => {
    utils.items.getAll.setData(
      {
        containerId: initContainer?.id,
      },
      initItems,
    );
  }, [initItems, initContainer?.id, utils.items.getAll]);

  const { data: container = initContainer } = api.containers.getById.useQuery(
    {
      id: initContainer?.id ?? 0,
    },
    {
      enabled: !!initContainer?.id,
    },
  );

  const { data: items = initItems, isLoading } = api.items.getAll.useQuery({
    containerId: container?.id,
  });

  const columns: ColumnDef<ItemWithPathname>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "count",
      header: "Count",
    },
    {
      accessorKey: "pathname",
      header: "Container",
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div>{format(row.getValue("createdAt"), "M/dd/yyyy")}</div>
      ),
    },
    {
      header: "View",
      cell: ({ row }) => (
        <Link href={`/items/${row.original.id}`}>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data: items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  if (!items.length && isLoading) {
    return <div className="flex justify-center p-4">Loading items...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader className="">
        <CardTitle className="capitalize">
          {container ? `${container.path}'s items` : "All items"}
        </CardTitle>
        <CardDescription>
          {items.length} {pluralize(items.length, "item")} found.
        </CardDescription>
        <CardAction className="flex items-center justify-between">
          <Input
            placeholder="Filter by name..."
            value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("name")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="max-w-[150px]">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="max-w-[150px] overflow-hidden overflow-ellipsis"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No items found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={openAddItem}>
          Add Item
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </CardFooter>
      <AddItemForm isOpen={isAddItemOpen} onClose={closeAddItem} />
    </Card>
  );
};

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
import type { ItemWithPathname } from "@/server/db/schema";
import {
  Card,
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
}: {
  initItems: ItemWithPathname[];
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
    utils.items.getAll.setData(undefined, initItems);
  }, [initItems, utils.items.getAll]);

  const { data: items = initItems, isLoading } = api.items.getAll.useQuery();

  const columns: ColumnDef<ItemWithPathname>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div>{row.getValue("name")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div>{row.getValue("description") ?? "-"}</div>,
    },
    {
      accessorKey: "count",
      header: "Count",
      cell: ({ row }) => <div>{row.getValue("count")}</div>,
    },
    {
      accessorKey: "pathname",
      header: "Container",
      cell: ({ row }) => <div>{row.getValue("pathname")}</div>,
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
    <Card className="w-full max-w-2xl">
      <CardHeader className="">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center justify-between">
            <Input
              placeholder="Filter by name..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </CardTitle>
          <CardDescription className="text-right">
            {items.length} {pluralize(items.length, "item")} found.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
                      <TableCell key={cell.id}>
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

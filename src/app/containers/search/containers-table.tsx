"use client";

import { useState } from "react";
import { keepPreviousData } from "@tanstack/react-query";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
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
import { format } from "date-fns";
import Link from "next/link";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounceValue } from "@/hooks/use-debounce-value";
import type { ContainerSelect } from "@/server/db/schema";

export const ContainersTable = ({
  initContainers,
  className,
}: {
  initContainers: ContainerSelect[];
  className?: string;
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounceValue(searchQuery, 400);

  const { data: allContainers = initContainers } = api.containers.getAll.useQuery(
    undefined,
    { enabled: debouncedQuery.length < 1 },
  );

  const { data: searchResults } = api.containers.searchContainer.useQuery(
    { query: debouncedQuery },
    { enabled: debouncedQuery.length >= 1, placeholderData: keepPreviousData },
  );

  const data = debouncedQuery.length >= 1 ? (searchResults ?? allContainers) : allContainers;

  const columns: ColumnDef<ContainerSelect>[] = [
    {
      accessorKey: "path",
      header: "Name",
    },
    {
      accessorKey: "pathname",
      header: "Path",
    },
    {
      accessorKey: "isPublic",
      header: "Visibility",
      cell: ({ row }) =>
        row.getValue<boolean>("isPublic") ? (
          <Badge variant="outline">Public</Badge>
        ) : (
          <Badge variant="secondary">Private</Badge>
        ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <div>{format(new Date(row.getValue<string>("createdAt")), "M/dd/yyyy")}</div>
      ),
    },
    {
      header: "View",
      cell: ({ row }) => (
        <Link href={`/containers/${row.original.id}`}>
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>Search Containers</CardTitle>
        <CardDescription>
          {data.length} container{data.length !== 1 ? "s" : ""} found.
        </CardDescription>
        <CardAction>
          <Input
            placeholder="Search by name or path..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
                    {searchQuery
                      ? "No containers found."
                      : "Type to search containers..."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="justify-end gap-2">
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
    </Card>
  );
};

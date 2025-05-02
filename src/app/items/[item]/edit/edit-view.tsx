"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FolderIcon, CheckIcon } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { ItemWithPathname } from "@/server/db/schema";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  count: z.number().int().min(1, "Count must be at least 1"),
  container: z.string().min(1, "Container is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const EditItemForm = ({ item }: { item: ItemWithPathname }) => {
  const router = useRouter();
  const [openPopover, setOpenPopover] = useState(false);
  const containerInputRef = useRef<HTMLInputElement>(null);
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      description: item.description ?? "",
      count: item.count ?? 1,
      container: item.pathname,
    },
  });

  const { data: containers, isLoading } =
    api.containers.searchContainer.useQuery(
      {
        query: form.watch("container"),
      },
      {
        enabled: form.watch("container").length > 0,
      },
    );

  const updateMutation = api.items.update.useMutation({
    onSuccess: () => {
      toast.success("Item updated", {
        description: "Your item has been updated successfully.",
      });
      void utils.items.getAll.invalidate();
      void utils.items.getById.invalidate({ itemId: item.id });
      router.push(`/items/${item.id}`);
    },
    onError: (error) => {
      toast.error("Failed to update item. Please try again.", {
        description: error.message,
      });
    },
  });

  const handleCommandSelect = useCallback(
    (value: string) => {
      const curr = form.getValues("container");
      // we are in the root container
      if (curr === "/") {
        form.setValue("container", `/${value}/`);
        return;
      }

      // if no current search, add new segment
      if (curr.endsWith("/")) {
        form.setValue("container", `${curr}${value}/`);
        return;
      }

      // we have a search query, remove and add new segment
      const segments = curr.split("/").filter(Boolean);
      segments.pop();
      if (segments?.length === 0) {
        form.setValue("container", `/${value}/`);
        return;
      }

      form.setValue("container", `/${segments.join("/")}/${value}/`);
    },
    [form],
  );

  const handleCommandValueChange = (value: string) => {
    const curr = form.getValues("container");
    // we are at the root container
    if (curr === "/") {
      form.setValue("container", `/${value}`);
      return;
    }

    if (curr.endsWith("/")) {
      // starting new search
      form.setValue("container", `${curr}${value}`);
      return;
    }

    // remove partial search, add new search
    const segments = curr.split("/").filter(Boolean);
    segments.pop();
    if (segments.length === 0) {
      form.setValue("container", `/${value}`);
      return;
    }

    form.setValue("container", `/${segments.join("/")}/${value}`);
  };

  const handleCommandKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // if we have no search query and we press backspace, we want to go up a level
      if (e.key === "Backspace" && e.currentTarget.value.length === 0) {
        const curr = form.getValues("container");
        const segments = curr.trim().split("/").filter(Boolean);
        segments.pop();

        if (segments.length === 0) {
          form.setValue("container", "/");
          return;
        }

        form.setValue("container", `/${segments.join("/")}/`);
      }
    },
    [form],
  );

  const onSubmit = useCallback(
    (values: FormValues) => {
      updateMutation.mutate({
        itemId: item.id,
        ...values,
      });
    },
    [item.id, updateMutation],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Item</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="container"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Container</FormLabel>
                  <Popover open={openPopover} onOpenChange={setOpenPopover}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            onChange={(e) => {
                              e.preventDefault();
                            }}
                            onClick={(e) => e.preventDefault()}
                            onFocus={() => {
                              setOpenPopover(true);
                              containerInputRef.current?.focus();
                            }}
                            placeholder="/storage/location"
                            className="w-full"
                          />
                        </div>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0" align="start">
                      <Command>
                        <CommandInput
                          ref={containerInputRef}
                          placeholder="Search containers..."
                          value={field.value.split("/").pop() ?? ""}
                          onValueChange={handleCommandValueChange}
                          onKeyDown={handleCommandKeyDown}
                        />
                        <CommandList>
                          <CommandEmpty>No containers found.</CommandEmpty>
                          <CommandGroup heading="Containers">
                            {containers?.length ? (
                              containers.map((item) => (
                                <CommandItem
                                  key={item.id}
                                  value={item.path}
                                  onSelect={handleCommandSelect}
                                  className="flex items-center gap-2"
                                >
                                  <FolderIcon className="h-4 w-4" />
                                  <span>{item.path}</span>
                                  {field.value === item.path && (
                                    <CheckIcon className="ml-auto h-4 w-4" />
                                  )}
                                </CommandItem>
                              ))
                            ) : (
                              <CommandItem disabled>
                                {isLoading ? "Loading..." : "Type to search"}
                              </CommandItem>
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Select where this item is stored
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Item name" />
                  </FormControl>
                  <FormDescription>The name of your item</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Item description (optional)"
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional details about your item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                      value={field.value}
                    />
                  </FormControl>
                  <FormDescription>
                    How many of this item do you have
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending || !form.formState.isDirty}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

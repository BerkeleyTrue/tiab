"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import type { ItemDTO } from "@/types/dto";
import { ContainerSelect } from "@/components/container-select";
import MultipleSelector from "@/components/ui/multi-select";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  count: z.number().int().min(1, "Count must be at least 1"),
  tags: z.array(z.string()).optional(),
  container: z.string().min(1, "Container is required"),
  isPublic: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const EditItemForm = ({ item }: { item: ItemDTO }) => {
  const router = useRouter();
  const utils = api.useUtils();
  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      description: item.description ?? "",
      count: item.count ?? 1,
      container: item.pathname,
      isPublic: item.isPublic ?? false,
      tags: item.tags ?? [],
    },
  });

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ContainerSelect
              control={form.control}
              watch={form.watch}
              setValue={form.setValue}
              getValues={form.getValues}
              description="Select a container for your item"
              label="Container"
              onTabPress={() => {
                nameInputRef.current?.focus();
              }}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      ref={nameInputRef}
                      placeholder="Item name"
                      onChange={(e) => {
                        field.onChange(e.target.value.replace(/\s+/g, "_"));
                      }}
                    />
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
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <MultipleSelector
                      creatable
                      onSearch={async (search) => {
                        const tags = await utils.tags.search.fetch({
                          query: search,
                        });
                        return tags.map((tag) => ({
                          label: tag.name,
                          value: tag.name,
                        }));
                      }}
                      value={(field.value ?? []).map((tag) => ({
                        label: tag,
                        value: tag,
                      }))}
                      onChange={(value) =>
                        field.onChange(
                          value.map((o) => o.value),
                          { shouldValidate: true, shouldDirty: true },
                        )
                      }
                      placeholder="Select or create tags"
                    />
                  </FormControl>
                  <FormDescription>
                    Add tags to categorize your item
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
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      id={field.name}
                      className="h-4 w-4"
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel>Public</FormLabel>
                  <FormDescription>
                    Make this item visible to other users.
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
        </Card>
      </form>
    </Form>
  );
};

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
import type { ItemWithPathname } from "@/server/db/schema";
import { toast } from "sonner";
import { ContainerSelect } from "@/components/container-select";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  count: z.number().int().min(1, "Count must be at least 1"),
  container: z.string().min(1, "Container is required"),
});

type FormValues = z.infer<typeof formSchema>;

export const EditItemForm = ({ item }: { item: ItemWithPathname }) => {
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
    <Card>
      <CardHeader>
        <CardTitle>Edit Item</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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

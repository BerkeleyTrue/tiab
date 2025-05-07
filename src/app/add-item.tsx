import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { useRef, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ContainerSelect } from "@/components/container-select";
import { Checkbox } from "@/components/ui/checkbox";

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  count: z.number().min(1, { message: "Count must be at least 1" }),
  container: z.string().min(1, { message: "Container is required" }),
  isPublic: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const AddItemForm = ({
  isOpen,
  onClose,
  containerId,
}: {
  isOpen: boolean;
  onClose: () => void;
  containerId?: number;
}) => {
  const utils = api.useUtils();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { data: pathname } = api.containers.getPathname.useQuery(
    { containerId: containerId ?? 0 },
    {
      enabled: !!containerId,
    },
  );

  // Initialize form with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      count: 1,
      container: "/",
      isPublic: false,
    },
  });

  // Set the default container value if containerId is provided
  useEffect(() => {
    if (containerId && pathname) {
      form.setValue("container", pathname);
    }
  }, [pathname, form]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = useCallback(() => {
    onClose();
    form.reset();
  }, [onClose, form]);

  const mutate = api.items.create.useMutation({
    onSuccess: () => {
      void utils.items.getAll.invalidate();
      handleClose();
      toast.success("Item created successfully!");
    },
    onError: () => {
      toast.error("Error creating item");
      form.setError("root", {
        message: "Failed to create item. Please try again.",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <Form {...form}>
          <DialogHeader>
            <DialogTitle>
              {pathname ? `Add to ${pathname}` : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((values) => {
              mutate.mutate(values);
            })}
            className="flex w-full flex-col gap-4"
          >
            <ContainerSelect
              control={form.control}
              watch={form.watch}
              setValue={form.setValue}
              getValues={form.getValues}
              onTabPress={() => {
                nameInputRef.current?.focus();
              }}
              disabled={!!containerId}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Item name"
                      {...field}
                      ref={nameInputRef}
                      onChange={(e) => {
                        field.onChange(e.target.value.replace(/\s+/g, "_"));
                      }}
                    />
                  </FormControl>
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
                    <Input placeholder="Item description" {...field} />
                  </FormControl>
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
                      placeholder="Quantity"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
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

            {form.formState.errors.root && (
              <p className="text-sm text-red-500">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="submit"
                className="mt-2"
                disabled={mutate.isPending}
              >
                {mutate.isPending ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

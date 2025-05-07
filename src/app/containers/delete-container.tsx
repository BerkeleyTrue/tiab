import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { ContainerSelect } from "@/components/container-select";
import { z } from "zod";

// Define the form schema with Zod
const formSchema = z.object({
  container: z.string().min(1, { message: "Container is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export const DeleteContainer = ({
  containerId,
  isOpen,
  onDelete,
  onClose,
  hasItems = false,
}: {
  containerId: number;
  isOpen: boolean;
  hasItems?: boolean;
  onDelete: () => void;
  onClose: () => void;
}) => {
  const utils = api.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      container: "/",
    },
  });

  useEffect(() => {
    if (!hasItems) {
      form.setValue("container", "/", { shouldValidate: true });
    }
  }, [hasItems, form]);

  const mutate = api.containers.delete.useMutation({
    onSuccess: () => {
      void utils.containers.getDirectoryTree.invalidate({ containerId });
      onDelete();
    },
    onError: () => {
      toast.error("Error deleting container");
    },
  });

  const onDeleteClick = useCallback(
    (values: FormValues) => {
      mutate.mutate({
        containerId,
        newPathname: values.container ?? undefined,
      });
    },
    [mutate, containerId],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <Form {...form}>
          <DialogHeader>
            <DialogTitle>Delete Container</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onDeleteClick)}
            className="flex w-full flex-col gap-4"
          >
            Are you sure you want to delete this container? This action cannot
            be undone.
            {hasItems && (
              <p className="text-sm text-red-500">
                This container has items. You must move them to another
                container before deleting.
              </p>
            )}
            {hasItems && (
              <ContainerSelect
                control={form.control}
                getValues={form.getValues}
                label="Select a new container"
                description="Select a new container to move the items to."
                setValue={form.setValue}
                watch={form.watch}
              />
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={mutate.isPending}
                type="button"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                type="submit"
                disabled={mutate.isPending}
              >
                {mutate.isPending ? "Deleting..." : "Delete"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

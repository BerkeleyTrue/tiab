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
import { useCallback } from "react";
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

export const AddContainer = ({
  basePathname,
  isOpen,
  onAdded,
  onClose,
}: {
  basePathname: string;
  isOpen: boolean;
  hasItems?: boolean;
  onAdded: () => void;
  onClose: () => void;
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      container: basePathname,
    },
  });

  const mutate = api.containers.ensurePathname.useMutation({
    onSuccess: () => {
      onAdded();
      form.reset();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Error adding container");
    },
  });

  const onAddClick = useCallback(
    (values: FormValues) => {
      mutate.mutate({
        pathname: values.container ?? undefined,
      });
    },
    [mutate],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <Form {...form}>
          <DialogHeader>
            <DialogTitle>Add Container</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onAddClick)}
            className="flex w-full flex-col gap-4"
          >
            <ContainerSelect
              control={form.control}
              getValues={form.getValues}
              label="Select a new container"
              description="Select a new container to add here."
              setValue={form.setValue}
              watch={form.watch}
            />
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
                {mutate.isPending ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

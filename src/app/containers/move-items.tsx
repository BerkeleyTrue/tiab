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
import { useCallback, useRef } from "react";
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

export const MoveItems = ({
  containerId,
  isOpen,
  onMove,
  onClose,
}: {
  containerId: number;
  isOpen: boolean;
  onMove: () => void;
  onClose: () => void;
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      container: "/",
    },
  });

  const mutate = api.items.moveItemsToContainer.useMutation({
    onSuccess: () => {
      onMove();
    },
    onError: () => {
      toast.error("Error moving items");
    },
  });

  const onMoveClick = useCallback(
    (values: FormValues) => {
      mutate.mutate({
        containerId,
        newPathname: values.container,
      });
    },
    [mutate, containerId],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <Form {...form}>
          <DialogHeader>
            <DialogTitle>Move Container Items</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onMoveClick)}
            className="flex w-full flex-col gap-4"
          >
            Are you sure you want to move the items to a new container?
            <ContainerSelect
              control={form.control}
              getValues={form.getValues}
              setValue={form.setValue}
              watch={form.watch}
              onTabPress={() => {
                buttonRef.current?.focus();
              }}
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
                ref={buttonRef}
                variant="destructive"
                type="submit"
                disabled={mutate.isPending}
              >
                {mutate.isPending ? "Moving..." : "Move"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

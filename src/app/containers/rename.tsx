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
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";

// Define the form schema with Zod
const formSchema = z.object({
  path: z.string().min(1, { message: "New container name" }),
});

type FormValues = z.infer<typeof formSchema>;

export const RenameContainer = ({
  containerId,
  initPath,
  isOpen,
  onRenamed,
  onClose,
}: {
  containerId: number;
  initPath: string;
  isOpen: boolean;
  hasItems?: boolean;
  onRenamed: () => void;
  onClose: () => void;
}) => {
  const nextRef = useRef<HTMLButtonElement>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      path: initPath,
    },
  });

  useEffect(() => {
    if (isOpen && initPath) {
      form.setValue("path", initPath);
    }
  }, [isOpen, initPath, form]);

  const mutate = api.containers.update.useMutation({
    onSuccess: () => {
      onRenamed();
      form.reset();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Error renaming container");
    },
  });

  const onRenameClick = useCallback(
    (values: FormValues) => {
      mutate.mutate({
        containerId,
        path: values.path ?? undefined,
      });
    },
    [mutate, containerId],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <Form {...form}>
          <DialogHeader>
            <DialogTitle>Rename Container</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onRenameClick)}
            className="flex w-full flex-col gap-4"
          >
            <FormField
              {...form}
              name="path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Container Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Container name"
                      {...field}
                      disabled={mutate.isPending}
                    />
                  </FormControl>
                  <FormDescription>The name of the container.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            ></FormField>
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
                ref={nextRef}
                variant="destructive"
                type="submit"
                disabled={mutate.isPending}
              >
                {mutate.isPending ? "Renaming..." : "Rename"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

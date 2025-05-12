import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { ContainerSelect } from "@/components/container-select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import { useRef } from "react";

const formSchema = z.object({
  container: z.string().min(1, "Container is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface OrphanedItemsFormProps {
  orphanedItems: Array<{ id: number; name: string }>;
  onSuccess?: () => void;
}

export function OrphanedItemsForm({
  orphanedItems,
  onSuccess,
}: OrphanedItemsFormProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      container: "/",
    },
  });

  const moveItemsMutation = api.items.moveOrphanedItems.useMutation({
    onSuccess: () => {
      toast.success("Items moved successfully");
      form.reset();
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast.error(`Failed to move items: ${error.message}`);
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (orphanedItems.length === 0) {
      toast.info("No orphaned items to move");
      return;
    }

    moveItemsMutation.mutate({
      itemIds: orphanedItems.map((item) => item.id),
      container: data.container,
    });
  };

  if (orphanedItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Orphaned Items</CardTitle>
          <CardDescription>
            No orphaned items found. All items are properly assigned to
            containers.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orphaned Items</CardTitle>
        <CardDescription>
          {orphanedItems.length} item(s) found without a valid container. Select
          a destination container to move them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-medium">Items to move:</h3>
          <ul className="text-muted-foreground list-disc pl-5 text-sm">
            {orphanedItems.map((item) => (
              <li key={item.id}>{item.name}</li>
            ))}
          </ul>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ContainerSelect
              control={form.control}
              watch={form.watch}
              getValues={form.getValues}
              setValue={form.setValue}
              disabled={moveItemsMutation.isPending}
              onTabPress={() => {
                buttonRef.current?.focus();
              }}
            />

            <Button
              ref={buttonRef}
              type="submit"
              className="w-full"
              disabled={
                moveItemsMutation.isPending || orphanedItems.length === 0
              }
            >
              {moveItemsMutation.isPending ? "Moving Items..." : "Move Items"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

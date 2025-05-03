import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api } from "@/trpc/react";
import { useState, useRef, useEffect } from "react";
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
import { FolderIcon, CheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

// Define the form schema with Zod
const formSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  count: z.number().min(1, { message: "Count must be at least 1" }),
  container: z.string().min(1, { message: "Container is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export const AddItemForm = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const utils = api.useUtils();
  const [openPopover, setOpenPopover] = useState(false);
  const containerInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with react-hook-form and zod validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      count: 1,
      container: "/",
    },
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setOpenPopover(false);
    }
  }, [isOpen, form]);

  const { data: containers, isLoading } =
    api.containers.searchContainer.useQuery(
      {
        query: form.watch("container"),
      },
      {
        enabled: isOpen && form.watch("container").length > 0,
      },
    );

  const mutate = api.items.create.useMutation({
    onSuccess: () => {
      void utils.items.getAll.invalidate();
      onClose();
      form.reset();
      toast.success("Item created successfully!");
    },
    onError: () => {
      toast.error("Error creating item");
      form.setError("root", { 
        message: "Failed to create item. Please try again." 
      });
    },
  });

  const handleCommandSelect = (value: string) => {
    const currentContainer = form.getValues("container");
    let newContainer: string;
    
    // we are in the root container
    if (currentContainer === "/") {
      newContainer = `/${value}/`;
    }
    // if no current search, add new segment
    else if (currentContainer.endsWith("/")) {
      newContainer = `${currentContainer}${value}/`;
    }
    // we have a search query, remove and add new segment
    else {
      const segments = currentContainer.split("/").filter(Boolean);
      segments.pop();

      if (segments.length === 0) {
        newContainer = `/${value}/`;
      } else {
        newContainer = `/${segments.join("/")}/${value}/`;
      }
    }
    
    form.setValue("container", newContainer);
  };

  const handleCommandValueChange = (value: string) => {
    const currentContainer = form.getValues("container");
    let newContainer: string;
    
    // we are at the root container
    if (currentContainer === "/") {
      newContainer = `/${value}`;
    }
    else if (currentContainer.endsWith("/")) {
      // starting new search
      newContainer = `${currentContainer}${value}`;
    }
    // remove partial search, add new search
    else {
      const segments = currentContainer.split("/").filter(Boolean);
      segments.pop();
      if (segments.length === 0) {
        newContainer = `/${value}`;
      } else {
        newContainer = `/${segments.join("/")}/${value}`;
      }
    }
    
    form.setValue("container", newContainer);
  };

  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // if we have no search query and we press backspace, we want to go up a level
    if (e.key === "Backspace" && e.currentTarget.value.length === 0) {
      const currentContainer = form.getValues("container");
      const segments = currentContainer.trim().split("/").filter(Boolean);
      segments.pop();
      
      const newContainer = segments.length === 0 ? "/" : `/${segments.join("/")}/`;
      form.setValue("container", newContainer);
    } else if (e.key === "Tab") {
      setOpenPopover(false);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Item</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit((values) => {
              mutate.mutate(values);
            })}
            className="flex w-full flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="container"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Container</FormLabel>
                  <FormControl>
                    <Popover open={openPopover} onOpenChange={setOpenPopover}>
                      <PopoverTrigger asChild>
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
                  </FormControl>
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
                    <Input 
                      placeholder="Item name" 
                      {...field} 
                      ref={nameInputRef}
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
                    <Input 
                      placeholder="Item description" 
                      {...field} 
                    />
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

            {form.formState.errors.root && (
              <p className="text-sm text-red-500">
                {form.formState.errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              className="mt-2"
              disabled={mutate.isPending}
            >
              {mutate.isPending ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

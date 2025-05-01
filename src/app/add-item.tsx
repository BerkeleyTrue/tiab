"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { cn } from "@/lib/utils";


export const AddItemForm = ({
  onSuccess,
  className,
}: {
  onSuccess?: () => void;
  className?: string;
}) => {
  const utils = api.useUtils();

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [count, setCount] = useState(1);
  const [container, setContainer] = useState("/");
  const [error, setError] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState(false);

  // reset state
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setDescription("");
      setCount(1);
      setContainer("/");
      setError(null);
      setOpenPopover(false);
    }
  }, [isOpen]);

  const containerInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const { data: containers, isLoading } =
    api.containers.searchContainer.useQuery(
      {
        query: container,
      },
      {
        enabled: isOpen && container.length > 0,
      },
    );

  const mutate = api.items.create.useMutation({
    onSuccess: () => {
      void utils.items.getAll.invalidate();

      setIsOpen(false);
      setName("");
      setDescription("");
      setCount(1);
      setContainer("/");
      setError(null);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating item:", error);
      setError("Failed to create item. Please try again.");
    },
  });

  const handleCommandSelect = (value: string) => {
    setContainer((curr) => {
      // we are in the root container
      if (curr === "/") {
        return `/${value}/`;
      }

      // if no current search, add new segment
      if (curr.endsWith("/")) {
        return `${curr}${value}/`;
      }

      // we have a search query, remove and add new segment
      const segments = curr.split("/").filter(Boolean);
      segments.pop();
      if (segments.length === 0) {
        return `/${value}/`;
      }

      return `/${segments.join("/")}/${value}/`;
    });
  };

  const handleCommandValueChange = (value: string) => {
    setContainer((curr) => {
      // we are at the root container
      if (curr === "/") {
        return `/${value}`;
      }

      if (curr.endsWith("/")) {
        // starting new search
        return `${curr}${value}`;
      }

      // remove partial search, add new search
      const segments = curr.split("/").filter(Boolean);
      segments.pop();
      if (segments.length === 0) {
        return `/${value}`;
      }

      return `/${segments.join("/")}/${value}`;
    });
  };

  const handleCommandKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // if we have no search query and we press backspace, we want to go up a level
    if (e.key === "Backspace" && e.currentTarget.value.length === 0) {
      setContainer((curr) => {
        const segments = curr.trim().split("/").filter(Boolean);
        segments.pop();

        if (segments.length === 0) {
          return "/";
        }

        return `/${segments.join("/")}/`;
      });
    } else if (e.key === "Tab") {
      setOpenPopover(false);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className={cn("px-4 py-2", className)}>
            Add Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <form className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="container">Container</label>
              <Popover open={openPopover} onOpenChange={setOpenPopover}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Input
                      id="container"
                      value={container}
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
                      value={container.split("/").pop() ?? ""}
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
                              {container === item.path && (
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

              <label htmlFor="name">Name</label>
              <Input
                id="name"
                ref={nameInputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
              />

              <label htmlFor="description">Description</label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Item description"
              />

              <label htmlFor="count">Count</label>
              <Input
                id="count"
                type="number"
                min="1"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                placeholder="Quantity"
              />

              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <Button
              type="submit"
              className="mt-2"
              disabled={mutate.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (!name.trim()) {
                  setError("Name is required");
                  return;
                }
                mutate.mutate({ name, description, count, container });
              }}
            >
              {mutate.isPending ? "Adding..." : "Add Item"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

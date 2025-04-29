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
import { useState } from "react";

export const AddItemForm = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [count, setCount] = useState(1);
  const [container, setContainer] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mutate = api.items.create.useMutation({
    onSuccess: () => {
      setIsOpen(false);
      setName("");
      setDescription("");
      setCount(1);
      setContainer("");
      setError(null);
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Error creating item:", error);
      setError("Failed to create item. Please try again.");
    },
  });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="px-4 py-2">
            Add Item
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <form className="flex w-full flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name">Name</label>
              <Input
                id="name"
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

              <label htmlFor="container">Container</label>
              <Input
                id="container"
                value={container}
                onChange={(e) => setContainer(e.target.value)}
                placeholder="Storage location"
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

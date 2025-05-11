"use client";

import { useState } from "react";
import { OrphanedItemsForm } from "@/components/orphaned-items-form";
import { api } from "@/trpc/react";

interface OrphanedItemsSectionProps {
  orphanedItems: Array<{ id: number; name: string }>;
}

export function OrphanedItemsSection({ orphanedItems: initialOrphanedItems }: OrphanedItemsSectionProps) {
  const [orphanedItems, setOrphanedItems] = useState(initialOrphanedItems);
  
  const { refetch } = api.items.orphaned.useQuery(undefined, {
    initialData: initialOrphanedItems,
    enabled: false,
  });

  const handleSuccess = async () => {
    const { data = [] } = await refetch();
    setOrphanedItems(data);
  };

  return (
    <OrphanedItemsForm 
      orphanedItems={orphanedItems} 
      onSuccess={handleSuccess} 
    />
  );
}

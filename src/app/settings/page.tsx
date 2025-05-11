import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { api } from "@/trpc/server";
import { OrphanedItemsSection } from "./orphaned-items-section";

export default async function Page() {
  const orphanedItems = await api.items.orphaned();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure your application settings here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Manage your account settings
          </p>
        </CardContent>
      </Card>
      
      <OrphanedItemsSection orphanedItems={orphanedItems} />
    </div>
  );
}

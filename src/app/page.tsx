import { api } from "@/trpc/server";
import { ItemsTable } from "./items";
import { Card, CardContent } from "@/components/ui/card";

export default async function Home() {
  const items = await api.items.getAll({});

  return (
    <>
      <Card variant="outline">
        <CardContent>
          <header>
            <h1 className="text-lg font-bold">Trapped In A Box</h1>
            <p>Welcome to the world of containers!</p>
          </header>
        </CardContent>
      </Card>
      <ItemsTable initItems={items} />
    </>
  );
}

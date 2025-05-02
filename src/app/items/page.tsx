import { api } from "@/trpc/server";
import { ItemsTable } from "../items";

export default async function Home() {
  const items = await api.items.getAll();

  return (
      <ItemsTable initItems={items} />
  );
}

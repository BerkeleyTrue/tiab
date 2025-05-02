import { api } from "@/trpc/server";
import { ItemsTable } from "./items";

export default async function Home() {
  const items = await api.items.getAll();

  return (
    <>
      <header>
        <h1>Trapped In A Box</h1>
        <p>Welcome to the world of containers!</p>
      </header>
      <ItemsTable initItems={items} />
    </>
  );
}

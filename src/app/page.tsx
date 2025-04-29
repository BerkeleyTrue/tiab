import { HydrateClient } from "@/trpc/server";

export default async function Home() {

  return (
    <HydrateClient>
      <header>
        <h1>Trapped In A Box</h1>
        <p>Welcome to the world of containers!</p>
      </header>
    </HydrateClient>
  );
}

import { api } from "@/trpc/server";
import { ContainersTable } from "./containers-table";

export default async function Page() {
  const initContainers = await api.containers.getAll();

  return <ContainersTable initContainers={initContainers} />;
}

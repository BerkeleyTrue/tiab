import { api } from "@/trpc/server";
import { ContainersView } from "./containers-view";

export default async function Page() {
  const tree = await api.containers.getDirectoryTree({
    containerId: 0,
  });

  return <ContainersView tree={tree} />;
}

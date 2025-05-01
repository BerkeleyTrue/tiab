import { api } from "@/trpc/server";
import { ContainersTable } from "./containers-table";

export default async function Page() {
  const tree = await api.containers.getDirectoryTree({
    containerId: 0,
  })

  return (
    <ContainersTable tree={tree} />
  )
}

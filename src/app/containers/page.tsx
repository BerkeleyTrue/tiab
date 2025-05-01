import { api } from "@/trpc/server";
import { ContainersTable } from "./containers-table";

export default async function Page() {
  const tree = await api.containers.getDirectoryTree({
    path: "/",
  })

  return (
    <ContainersTable tree={tree} />
  )
}

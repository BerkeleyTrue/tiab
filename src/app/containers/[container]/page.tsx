import { api } from "@/trpc/server";
import { ContainersTable } from "../containers-table";

export default async function Page({
  params,
}: {
  params: Promise<{ container: string }>;
  }) {

  const path = (await params).container;

  const tree = await api.containers.getDirectoryTree({
    path,
  });

  return (
    <ContainersTable tree={tree} />
  )
}

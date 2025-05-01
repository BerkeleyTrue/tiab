import { api } from "@/trpc/server";
import { ContainersTable } from "../containers-table";

export default async function Page({
  params,
}: {
  params: Promise<{ container: string }>;
}) {
  const containerIdParam = (await params).container;
  let containerId = 0;
  try {
    containerId = parseInt(containerIdParam, 10);
  } catch (e) {
    console.error("Error parsing container ID:", e);
  }

  const tree = await api.containers.getDirectoryTree({
    containerId,
  });

  return <ContainersTable tree={tree} />;
}

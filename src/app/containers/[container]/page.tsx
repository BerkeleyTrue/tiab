import { api } from "@/trpc/server";
import { ContainersTable } from "../containers-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ container: string }>;
}) {
  const containerIdParam = (await params).container;
  let containerId = parseInt(containerIdParam, 10);

  if (isNaN(containerId)) {
    containerId = 0; // Default to root or handle error
  }

  const tree = await api.containers.getDirectoryTree({
    containerId,
  });

  return (
    <>
      <ContainersTable tree={tree} />
      {containerId === 0 && (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Invalid Container ID</AlertTitle>
          <AlertDescription>
            The container ID &apos;{containerIdParam}&apos; is not valid. Container IDs must
            be numbers. Showing root instead.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

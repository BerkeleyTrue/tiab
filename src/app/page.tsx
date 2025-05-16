import { api } from "@/trpc/server";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Signature } from "lucide-react";
import { ContainersView } from "./containers/containers-view";

export default async function Home() {
  const tree = await api.containers.getDirectoryTree({
    containerId: 0,
  });
  const user = await api.auth.getUser();

  return user ? (
    <ContainersView tree={tree} />
  ) : (
    <>
      <Card variant="outline">
        <CardContent>
          <header>
            <h1 className="text-lg font-bold">Trapped In A Box</h1>
            <p>Welcome to the world of containers!</p>
          </header>
        </CardContent>
      </Card>
      <Alert>
        <Signature className="size-4" />
        <AlertTitle>Not Signed In</AlertTitle>
        <AlertDescription className="">
          <p>
            You need to sign in to view your items.{" "}
            <Link href="/auth">Sign In</Link>
          </p>
        </AlertDescription>
      </Alert>
    </>
  );
}

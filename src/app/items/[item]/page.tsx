import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ItemView } from "./item-view";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ item: string }>;
}) {
  const itemIdParam = (await params).item;
  const itemId = parseInt(itemIdParam, 10);

  if (isNaN(itemId)) {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert variant="destructive">
          <AlertTitle>Invalid Item ID</AlertTitle>
          <AlertDescription>
            The item ID &apos;{itemIdParam}&apos; is not valid. Item IDs must be
            numbers.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  try {
    const item = await api.items.getById({ itemId });

    if (!item) {
      notFound();
    }

    return (
      <div className="container mx-auto max-w-4xl p-4">
        <ItemView item={item} />
      </div>
    );
  } catch {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            An error occurred while trying to fetch the item. Please try again
            later.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }
}

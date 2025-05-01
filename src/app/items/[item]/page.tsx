import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Home, ArrowLeft, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";

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
            The item ID &apos;{itemIdParam}&apos; is not valid. Item IDs must be numbers.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
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
        <div className="mb-4">
          <Button variant="outline" asChild>
            <Link href={`/containers/${item.containerId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Container
            </Link>
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center">
                  <Package className="mr-2 h-6 w-6" />
                  {item.name}
                </CardTitle>
                <CardDescription>
                  Located in: <Link href={`/containers/${item.containerId}`} className="hover:underline">{item.pathname}</Link>
                </CardDescription>
              </div>
              {(item.count ?? 0) > 1 && (
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  x{item.count}
                </Badge>
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            {item.description ? (
              <div className="prose dark:prose-invert max-w-none">
                <h3>Description</h3>
                <p>{item.description}</p>
              </div>
            ) : (
              <p className="text-muted-foreground italic">No description provided</p>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="mr-1 h-4 w-4" />
              Created {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
            </div>
            {item.updatedAt && (
              <div className="flex items-center">
                <Clock className="mr-1 h-4 w-4" />
                Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  } catch  {
    return (
      <div className="container mx-auto max-w-4xl p-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            An error occurred while trying to fetch the item. Please try again later.
          </AlertDescription>
        </Alert>
        <div className="flex justify-center mt-4">
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

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="container py-8">
      <div className="flex flex-col items-center text-center space-y-4 mb-12">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-6 w-96" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="overflow-hidden flex flex-col h-full">
            <Skeleton className="h-48 w-full" />
            <CardHeader className="pb-3">
              <div className="flex flex-wrap gap-2 mb-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-full" />
            </CardHeader>
            <CardContent className="pt-0 pb-4 flex-grow">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
            <CardFooter className="flex justify-between items-center pt-0 border-t">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-md" />
        <Skeleton className="h-10 w-52" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-52 mb-2" />
          <div className="text-sm text-muted-foreground">
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array(8)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              <div className="col-span-1 md:col-span-2 space-y-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
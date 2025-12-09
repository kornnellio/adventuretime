import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditAdventureLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-1/3 mb-2" />
        <Skeleton className="h-5 w-1/2" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <div className="flex flex-wrap gap-2">
                {Array(3).fill(null).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-24" />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full max-w-md mb-4" />
              {Array(3).fill(null).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full max-w-md mb-4" />
              {Array(3).fill(null).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-full max-w-md mb-4" />
          <Skeleton className="h-60 w-full" />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
} 
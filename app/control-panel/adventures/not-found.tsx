import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdventureNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <h2 className="text-3xl font-bold">Adventure Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        The adventure you're looking for doesn't exist or may have been removed.
      </p>
      <Button asChild>
        <Link href="/control-panel/adventures">
          Return to Adventures
        </Link>
      </Button>
    </div>
  );
} 
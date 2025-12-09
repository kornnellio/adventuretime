import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-3xl font-bold">User Not Found</h1>
      <p className="text-muted-foreground text-center max-w-md">
        The user you are looking for does not exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/control-panel/users">
          Return to Users
        </Link>
      </Button>
    </div>
  );
} 
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container py-16">
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center">
        <FileQuestion className="h-24 w-24 text-muted-foreground" />
        <h2 className="text-3xl font-bold">Blog Post Not Found</h2>
        <p className="text-muted-foreground max-w-md text-lg">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <div className="flex gap-4 mt-4">
          <Button asChild variant="outline">
            <Link href="/">
              Return Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/blog">
              Browse All Blogs
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 
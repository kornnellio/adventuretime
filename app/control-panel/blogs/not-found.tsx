import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
      <FileQuestion className="h-16 w-16 text-muted-foreground" />
      <h2 className="text-2xl font-bold">Blog Post Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        The blog post you're looking for doesn't exist or has been removed.
      </p>
      <Button asChild>
        <Link href="/control-panel/blogs">
          Back to Blogs
        </Link>
      </Button>
    </div>
  );
} 
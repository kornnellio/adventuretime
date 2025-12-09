'use client';

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { getBlogById } from "@/lib/actions/blog";
import BlogForm from "@/components/control-panel/blog-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { IBlog } from "@/lib/models/blog";

// In a real app, you would get the current user from a session or auth provider
const mockCurrentUser = {
  id: "1",
  name: "Admin User",
};

interface EditBlogPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditBlogPage({ params }: EditBlogPageProps) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  const [blog, setBlog] = useState<(IBlog & { _id: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await getBlogById(id);
        if (!response.success) {
          setError(response.error || "Failed to fetch blog");
          return;
        }
        setBlog(response.data);
      } catch (err) {
        setError("An unexpected error occurred");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  if (error && !isLoading) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.back()}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isLoading ? (
            <Skeleton className="h-9 w-48 inline-block" />
          ) : (
            `Edit Blog: ${blog?.title}`
          )}
        </h1>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      ) : blog ? (
        <BlogForm blog={blog} currentUser={mockCurrentUser} isEditing={true} />
      ) : null}
    </div>
  );
} 
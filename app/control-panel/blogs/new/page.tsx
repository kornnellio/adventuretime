'use client';

import { useRouter } from "next/navigation";
import BlogForm from "@/components/control-panel/blog-form";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

// In a real app, you would get the current user from a session or auth provider
// For this example, we'll use a mock user
const mockCurrentUser = {
  id: "1",
  name: "Admin User",
};

export default function NewBlogPage() {
  const router = useRouter();

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
        <h1 className="text-3xl font-bold tracking-tight">New Blog Post</h1>
      </div>
      
      <BlogForm currentUser={mockCurrentUser} />
    </div>
  );
} 
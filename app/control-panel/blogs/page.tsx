import Link from 'next/link';
import { format } from 'date-fns';
import { getBlogs } from '@/lib/actions/blog';
import { Button } from '@/components/ui/button';
import { IBlog } from '@/lib/models/blog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, PenLine, Eye } from 'lucide-react';
import DeleteBlogButton from '@/components/control-panel/delete-blog-button';
import { BlogThumbnail } from '@/components/control-panel/blog-thumbnail';

export const metadata = {
  title: 'Blogs - AdventureTime.Ro',
  description: 'Manage blogs on AdventureTime.Ro',
};

export default async function BlogsPage() {
  const { success, data: blogs, error } = await getBlogs();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blogs</h1>
          <p className="text-muted-foreground">
            Create and manage blog posts for your website.
          </p>
        </div>
        <Button asChild>
          <Link href="/control-panel/blogs/new">
            <Plus className="mr-2 h-4 w-4" />
            New Blog
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card">
        {!success ? (
          <div className="flex flex-col items-center justify-center p-6">
            <p className="text-red-500 mb-2">Failed to load blogs</p>
            <p className="text-muted-foreground">{error || 'Unknown error occurred'}</p>
          </div>
        ) : blogs?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10">
            <h3 className="text-xl font-semibold mb-2">No blog posts yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first blog post to share with your audience.
            </p>
            <Button asChild>
              <Link href="/control-panel/blogs/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Blog Post
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableCaption>A list of all blog posts.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs?.map((blog: IBlog & { _id: string }) => (
                <TableRow key={blog._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {blog.image && (
                        <BlogThumbnail src={blog.image} alt={blog.title} />
                      )}
                      <span className="truncate max-w-[250px]" title={blog.title}>
                        {blog.title}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{blog.author.name}</TableCell>
                  <TableCell>
                    {blog.createdAt && format(new Date(blog.createdAt), 'PPP')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {blog.tags?.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      {blog.tags?.length > 3 && (
                        <Badge variant="outline">+{blog.tags.length - 3} more</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="outline" asChild>
                        <Link href={`/blog/${blog._id}`} target="_blank">
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="outline" asChild>
                        <Link href={`/control-panel/blogs/${blog._id}`}>
                          <PenLine className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteBlogButton blogId={blog._id} blogTitle={blog.title} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
} 
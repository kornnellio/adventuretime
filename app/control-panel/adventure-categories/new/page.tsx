'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { createAdventureCategory } from '@/lib/actions/adventureCategory';
import { updateAdventuresCategory } from '@/lib/actions/adventure';
import { ImageUpload } from '@/components/ui/image-upload';
import { AdventureSelector } from '@/components/control-panel/adventure-selector';
import { isDevelopmentMode } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewAdventureCategoryPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedAdventureIds, setSelectedAdventureIds] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      // Validate that an image has been uploaded (skip in development mode)
      if (!imageUrl && !isDevelopmentMode()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please upload an image for the category",
        });
        return;
      }

      const data = {
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        image: imageUrl || (isDevelopmentMode() ? '/images/placeholder.jpg' : ''),
      };

      const result = await createAdventureCategory(data);

      if (result.success) {
        // If adventures are selected, assign them to the new category
        if (selectedAdventureIds.length > 0) {
          const updateResult = await updateAdventuresCategory(selectedAdventureIds, result.data._id);
          if (!updateResult.success) {
            console.warn('Failed to assign adventures to category:', updateResult.error);
            toast({
              variant: "destructive",
              title: "Warning",
              description: "Category created but failed to assign some adventures. You can assign them later.",
            });
          }
        }

        toast({
          title: "Success",
          description: `Adventure category created successfully${selectedAdventureIds.length > 0 ? ` with ${selectedAdventureIds.length} adventure(s) assigned` : ''}`,
        });
        router.push('/control-panel/adventure-categories');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to create adventure category",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (urls: string[]) => {
    // Take the first uploaded image as the category image
    setImageUrl(urls.length > 0 ? urls[0] : '');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/control-panel/adventure-categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Adventure Category</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Details */}
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(new FormData(e.currentTarget));
            }} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="Enter category title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  placeholder="Enter category description"
                />
              </div>

              <div className="space-y-2">
                <Label>Category Image</Label>
                <ImageUpload
                  values={imageUrl ? [imageUrl] : []}
                  onChange={handleImageChange}
                />
                <p className="text-sm text-muted-foreground">
                  Upload an image for the category. Only one image is allowed.
                  {isDevelopmentMode() && (
                    <span className="text-yellow-600"> (Optional in development mode)</span>
                  )}
                </p>
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting || (!imageUrl && !isDevelopmentMode())}>
                  {isSubmitting ? "Creating..." : "Create Category"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/control-panel/adventure-categories">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Adventure Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Adventures</CardTitle>
            <p className="text-sm text-muted-foreground">
              Select which adventures belong to this category. You can change this later.
            </p>
          </CardHeader>
          <CardContent>
            <AdventureSelector
              selectedAdventureIds={selectedAdventureIds}
              onSelectionChange={setSelectedAdventureIds}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { getAdventureCategoryById, updateAdventureCategory } from '@/lib/actions/adventureCategory';
import { getAdventuresByCategory, updateAdventuresCategory } from '@/lib/actions/adventure';
import { IAdventureCategory } from '@/lib/models/adventureCategory';
import { ImageUpload } from '@/components/ui/image-upload';
import { AdventureSelector } from '@/components/control-panel/adventure-selector';
import { isDevelopmentMode } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditAdventureCategoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditAdventureCategoryPage({ params }: EditAdventureCategoryPageProps) {
  const resolvedParams = use(params);
  const [category, setCategory] = useState<IAdventureCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [selectedAdventureIds, setSelectedAdventureIds] = useState<string[]>([]);
  const [initialAdventureIds, setInitialAdventureIds] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const result = await getAdventureCategoryById(resolvedParams.id);
        if (result.success) {
          setCategory(result.data);
          setImageUrl(result.data.image || '');
          
          // Fetch current adventures for this category
          const adventuresResult = await getAdventuresByCategory(resolvedParams.id);
          if (adventuresResult.success) {
            const adventureIds = adventuresResult.data.map((adv: any) => adv._id);
            setSelectedAdventureIds(adventureIds);
            setInitialAdventureIds(adventureIds);
          }
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Failed to load category",
          });
          router.push('/control-panel/adventure-categories');
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred",
        });
        router.push('/control-panel/adventure-categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [resolvedParams.id, router, toast]);

  const handleSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      // Validate that an image exists (skip in development mode)
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

      const result = await updateAdventureCategory(resolvedParams.id, data);

      if (result.success) {
        // Handle adventure assignments
        const addedAdventures = selectedAdventureIds.filter(id => !initialAdventureIds.includes(id));
        const removedAdventures = initialAdventureIds.filter(id => !selectedAdventureIds.includes(id));

        let adventureUpdateSuccess = true;

        // Add new adventures to category
        if (addedAdventures.length > 0) {
          const addResult = await updateAdventuresCategory(addedAdventures, resolvedParams.id);
          if (!addResult.success) {
            console.warn('Failed to add adventures to category:', addResult.error);
            adventureUpdateSuccess = false;
          }
        }

        // Remove adventures from category
        if (removedAdventures.length > 0) {
          const removeResult = await updateAdventuresCategory(removedAdventures, null);
          if (!removeResult.success) {
            console.warn('Failed to remove adventures from category:', removeResult.error);
            adventureUpdateSuccess = false;
          }
        }

        toast({
          title: "Success",
          description: adventureUpdateSuccess 
            ? "Adventure category updated successfully"
            : "Category updated but some adventure assignments may have failed",
        });
        router.push('/control-panel/adventure-categories');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to update adventure category",
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/control-panel/adventure-categories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Adventure Category</h1>
        </div>
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/control-panel/adventure-categories">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Categories
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Edit Adventure Category</h1>
        </div>
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <div className="text-center text-red-500">Category not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/control-panel/adventure-categories">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Categories
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Adventure Category</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Details */}
        <Card>
          <CardHeader>
            <CardTitle>Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  defaultValue={category.title}
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
                  defaultValue={category.description}
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
                  {isSubmitting ? "Updating..." : "Update Category"}
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
              Select which adventures belong to this category.
            </p>
          </CardHeader>
          <CardContent>
            <AdventureSelector
              categoryId={resolvedParams.id}
              selectedAdventureIds={selectedAdventureIds}
              onSelectionChange={setSelectedAdventureIds}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
import Link from 'next/link';
import { getAdventureCategories } from '@/lib/actions/adventureCategory';
import { IAdventureCategory } from "@/lib/models/adventureCategory";
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Pencil, Plus } from 'lucide-react';
import DeleteAdventureCategoryButton from '@/components/control-panel/delete-adventure-category-button';
import Image from 'next/image';

export const metadata = {
  title: 'Manage Adventure Categories - AdventureTime.Ro',
  description: 'Manage adventure categories in the admin control panel',
};

export default async function AdventureCategoriesPage() {
  const { success, data: categories, error } = await getAdventureCategories();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Adventure Categories</h1>
        <Button asChild>
          <Link href="/control-panel/adventure-categories/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Category
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Adventure Categories</CardTitle>
          <CardDescription>
            Manage your adventure categories. You can edit, delete, or create new categories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <div className="text-center p-6">
              <p className="text-red-500">{error || 'Failed to load adventure categories'}</p>
            </div>
          ) : categories?.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">No adventure categories found. Create your first category.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category: IAdventureCategory & { _id: any }) => (
                  <TableRow key={category._id.toString()}>
                    <TableCell>
                      <div className="relative w-16 h-16 rounded-md overflow-hidden">
                        <Image
                          src={category.image}
                          alt={category.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{category.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{category.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{category.slug}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/control-panel/adventure-categories/${category._id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteAdventureCategoryButton categoryId={category._id.toString()} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
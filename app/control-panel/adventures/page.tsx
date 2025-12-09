import Link from 'next/link';
import { getAdventures } from '@/lib/actions/adventure';
import { IAdventure } from "@/lib/models/adventure";
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
import { formatPrice } from '@/lib/utils';
import DeleteAdventureButton from '@/components/control-panel/delete-adventure-button';

export const metadata = {
  title: 'Manage Adventures - AdventureTime.Ro',
  description: 'Manage adventures in the admin control panel',
};

// Format date for display
const formatDate = (date: Date | undefined) => {
  if (!date) return 'No date';
  
  try {
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Format date range for display
const formatDateRange = (startDate: Date | undefined, endDate?: Date) => {
  try {
    // Handle case where startDate is undefined
    if (!startDate) {
      return 'No date available';
    }
    
    if (!endDate) {
      // If no end date, create one day after start date
      const inferredEndDate = new Date(startDate);
      inferredEndDate.setDate(inferredEndDate.getDate() + 1);
      return `${formatDate(startDate)} - ${formatDate(inferredEndDate)}`;
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  } catch (error) {
    console.error('Error formatting date range:', error);
    return 'Invalid date range';
  }
};

export default async function AdventuresPage() {
  const { success, data: adventures, error } = await getAdventures();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Adventures</h1>
        <Button asChild>
          <Link href="/control-panel/adventures/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Adventure
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Adventures</CardTitle>
          <CardDescription>
            Manage your adventure listings. You can edit, delete, or create new adventures.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!success ? (
            <div className="text-center p-6">
              <p className="text-red-500">{error || 'Failed to load adventures'}</p>
            </div>
          ) : adventures?.length === 0 ? (
            <div className="text-center p-6">
              <p className="text-muted-foreground">No adventures found. Create your first adventure.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adventures?.map((adventure: IAdventure & { _id: any }) => (
                  <TableRow key={adventure._id.toString()}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {adventure.title}
                        {adventure.isRecurring && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Recurent
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {adventure.isRecurring ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {adventure.recurringPattern?.daysOfWeek?.map(day => {
                              const dayNames = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
                              return dayNames[day];
                            }).join(', ')} {adventure.recurringPattern?.year}
                          </div>
                          <div className="text-muted-foreground">
                            {adventure.dates?.length || 0} evenimente
                          </div>
                        </div>
                      ) : (
                        formatDateRange(adventure.date, adventure.endDate)
                      )}
                    </TableCell>
                    <TableCell>{adventure.location}</TableCell>
                    <TableCell className="text-right">{formatPrice(adventure.price)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/control-panel/adventures/${adventure._id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteAdventureButton adventureId={adventure._id.toString()} />
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

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { deleteAdventure } from '@/lib/actions/adventure';

interface DeleteAdventureButtonProps {
  adventureId: string;
}

export default function DeleteAdventureButton({ adventureId }: DeleteAdventureButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const result = await deleteAdventure(adventureId);
      
      if (result.success) {
        toast({
          title: "Adventure deleted",
          description: "The adventure has been successfully deleted.",
        });
        router.refresh();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to delete adventure",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
    >
      <Trash className="h-4 w-4" />
    </Button>
  );
} 
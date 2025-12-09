import { notFound } from "next/navigation";
import AdventureForm from "@/components/control-panel/adventure-form";
import { getAdventureById } from "@/lib/actions/adventure";

export const metadata = {
  title: 'Edit Adventure - AdventureTime.Ro',
  description: 'Edit an existing adventure listing',
};

// PageProps expects params and searchParams to be Promises
export default async function EditAdventurePage({ 
  params,
  searchParams
}: { 
  params: Promise<{ slug: string }>,
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  await searchParams; // We need to await this even if we don't use it
  
  const { success, data: adventure, error } = await getAdventureById(slug);

  if (!success || !adventure) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Adventure</h1>
        <p className="text-muted-foreground mt-2">
          Update the details for {adventure.title}
        </p>
      </div>
      
      <AdventureForm adventure={adventure} isEditing={true} />
    </div>
  );
} 
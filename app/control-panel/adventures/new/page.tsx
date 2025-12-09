import AdventureForm from "@/components/control-panel/adventure-form";

export const metadata = {
  title: 'Add New Adventure - AdventureTime.Ro',
  description: 'Create a new adventure listing',
};

export default function NewAdventurePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Adventure</h1>
        <p className="text-muted-foreground mt-2">
          Create a new adventure listing with all the details needed.
        </p>
      </div>
      
      <AdventureForm />
    </div>
  );
} 
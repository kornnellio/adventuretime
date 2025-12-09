import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

export const metadata = {
  title: 'Blog - AdventureTime.Ro',
  description: 'Explore our blog posts about adventures and outdoor activities.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-0 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 
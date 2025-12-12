import { getAdventuresByCategorySlug } from '@/lib/actions/adventure';
import { AdventureCard } from '@/components/adventures/adventure-card';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Image from "next/image";
import { formatImageUrl } from '@/lib/utils';

type SuccessResult = {
    success: true;
    data: {
        category: any;
        adventures: any[];
    };
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const result = await getAdventuresByCategorySlug(slug);

    if (!result.success) {
        return {
            title: 'Categorie negăsită',
            description: 'Această categorie nu există.',
        };
    }

    const { category } = (result as SuccessResult).data;

    return {
        title: `${category.title} - Ture Caiac și SUP | AdventureTime.Ro`,
        description: category.description || `Descoperă aventurile din categoria ${category.title}. Ture de caiac și SUP pentru toate nivelurile de experiență.`,
        openGraph: {
            title: `${category.title} - AdventureTime.Ro`,
            description: category.description,
            type: 'website',
            url: `https://adventuretime.ro/categorii/${category.slug}`,
            images: [
                {
                    url: category.image || 'https://adventuretime.ro/logo.png',
                    width: 1200,
                    height: 630,
                    alt: category.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `${category.title} - AdventureTime.Ro`,
            description: category.description,
            images: [category.image || 'https://adventuretime.ro/logo.png'],
        },
    };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const result = await getAdventuresByCategorySlug(slug);

    if (!result.success) {
        notFound();
    }

    const { category, adventures } = (result as SuccessResult).data;

    return (
        <div className="bg-white py-12">
            <div className="container mx-auto px-4">
                <div className="relative h-64 md:h-96 rounded-lg overflow-hidden mb-8">
                    {category.image && (
                        <Image
                            src={formatImageUrl(category.image)}
                            alt={category.title}
                            fill
                            className="absolute inset-0 object-cover"
                        />
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center text-center text-white p-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">{category.title}</h1>
                        {category.description && (
                            <p className="mt-4 text-lg md:text-xl max-w-3xl">{category.description}</p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {adventures.map((adventure: any) => (
                        <AdventureCard 
                            key={adventure._id}
                            slug={adventure.slug || ''}
                            title={adventure.title}
                            description={adventure.description || ''}
                            shortDescription={adventure.shortDescription}
                            image={adventure.images[0]}
                            date={new Date(adventure.date).toLocaleDateString('ro-RO')}
                            endDate={new Date(adventure.endDate).toLocaleDateString('ro-RO')}
                            duration={`${adventure.duration.value} ${adventure.duration.unit === 'hours' ? 'ore' : 'zile'}`}
                            location={adventure.location}
                            price={adventure.price}
                        />
                    ))}
                </div>

                {adventures.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-xl text-gray-600">Momentan nu sunt aventuri disponibile în această categorie.</p>
                        <p className="mt-2 text-gray-500">Te rugăm să revii mai târziu sau să explorezi alte categorii.</p>
                    </div>
                )}
            </div>
        </div>
    );
} 
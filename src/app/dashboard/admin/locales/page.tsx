import { queryD1 } from '@/lib/cloudflare-d1';
import LocalesClient, { type LocaleItem } from './LocalesClient';

const CATEGORY_LABELS: Record<number, string> = {
  1: 'Veterinaria',
  2: 'Pet Shop',
  3: 'Cafetería',
  4: 'Restaurante',
  5: 'Grooming',
  6: 'Resort',
};

interface StoreRow {
  id_store: number;
  name: string;
  description: string | null;
  address: string | null;
  stars: number | null;
  fk_category: number | null;
  image_url: string | null;
}

function inferType(stars: number | null, index: number): 'Premium' | 'Profesional' | 'Free' {
  if (stars != null && stars >= 4.5) return 'Premium';
  if (stars != null && stars >= 4.0) return 'Profesional';
  return index % 2 === 0 ? 'Premium' : 'Profesional';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);
}

export default async function LocalesPage() {
  let locales: LocaleItem[] = [];

  try {
    const stores = await queryD1<StoreRow>(
      'SELECT id_store, name, description, address, stars, fk_category, image_url FROM stores ORDER BY id_store DESC',
      [],
      { revalidate: false },
    );

    const PLACEHOLDER_IMAGES = [
      'https://placehold.co/400x200/1f4b3b/ffffff?text=Local+1',
      'https://placehold.co/400x200/3d6b4f/ffffff?text=Local+2',
      'https://placehold.co/400x200/7d8b6a/ffffff?text=Local+3',
      'https://placehold.co/400x200/3d6b6b/ffffff?text=Local+4',
      'https://placehold.co/400x200/173a2d/ffffff?text=Local+5',
      'https://placehold.co/400x200/5a7a5a/ffffff?text=Local+6',
    ];

    locales = stores.map((store, i) => ({
      id: store.id_store,
      name: store.name,
      email: `${slugify(store.name) || 'contacto'}@gmail.com`,
      category: store.fk_category != null
        ? (CATEGORY_LABELS[store.fk_category] ?? 'Sin categoría')
        : 'Sin categoría',
      categoryId: store.fk_category,
      rating: store.stars,
      favorites: Math.floor(Math.random() * 400) + 20,
      type: inferType(store.stars, i),
      description: store.description ?? '',
      address: store.address ?? '',
      image: store.image_url ?? PLACEHOLDER_IMAGES[i % PLACEHOLDER_IMAGES.length],
    }));
  } catch {
    // Fallback sample data when D1 is unavailable
    locales = [
      { id: 1, name: 'Veterinaria PetCare', email: 'petcare@gmail.com', category: 'Veterinaria', categoryId: 1, rating: 4.9, favorites: 245, type: 'Premium', description: 'Cuidado integral para mascotas', address: 'Av. Corrientes 1234, CABA', image: 'https://placehold.co/400x200/1f4b3b/ffffff?text=PetCare' },
      { id: 2, name: 'Cafetería Guau', email: 'cafeguau@gmail.com', category: 'Cafetería', categoryId: 3, rating: 4.8, favorites: 50, type: 'Profesional', description: 'Café pet-friendly', address: 'Av. Santa Fe 456, CABA', image: 'https://placehold.co/400x200/3d6b4f/ffffff?text=Guau' },
      { id: 3, name: 'Pet Shop Central', email: 'petshop@gmail.com', category: 'Pet Shop', categoryId: 2, rating: 4.9, favorites: 451, type: 'Premium', description: 'Todo para tu mascota', address: 'Florida 789, CABA', image: 'https://placehold.co/400x200/7d8b6a/ffffff?text=PetShop' },
      { id: 4, name: 'Grooming Elegante', email: 'grooming@gmail.com', category: 'Grooming', categoryId: 5, rating: 4.5, favorites: 80, type: 'Profesional', description: 'Peluquería canina de autor', address: 'Av. Callao 321, CABA', image: 'https://placehold.co/400x200/3d6b6b/ffffff?text=Grooming' },
      { id: 5, name: 'Resort Canino', email: 'resort@gmail.com', category: 'Resort', categoryId: 6, rating: 4.7, favorites: 320, type: 'Premium', description: 'Hospedaje de lujo para perros', address: 'Ruta 8, Pilar', image: 'https://placehold.co/400x200/173a2d/ffffff?text=Resort' },
      { id: 6, name: 'Restaurante DogFriendly', email: 'dogfriendly@gmail.com', category: 'Restaurante', categoryId: 4, rating: 4.6, favorites: 150, type: 'Profesional', description: 'Restaurante con área para mascotas', address: 'Palermo 567, CABA', image: 'https://placehold.co/400x200/5a7a5a/ffffff?text=DogFriendly' },
    ];
  }

  return <LocalesClient initialLocales={locales} />;
}

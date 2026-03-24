import { queryD1, CloudflareD1Error } from "@/lib/cloudflare-d1";
import LocationsFilterClient, { type LocationItem } from "./LocationsFilterClient";

interface StoreRow {
  id_store: number;
  name: string;
  description: string | null;
  address: string | null;
  location: string | null;
  stars: number | null;
  fk_category: number | null;
}

const CATEGORY_LABELS: Record<number, string> = {
  1: "Veterinaria",
  2: "Pet Shop",
  3: "Cafetería",
  4: "Restaurante",
  5: "Grooming",
  6: "Resort",
};

function extractCityFromAddress(address: string | null): string | null {
  if (!address) {
    return null;
  }

  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return parts[parts.length - 2];
  }

  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }

  return null;
}

export default async function LocationsFilterSection() {
  let locations: LocationItem[] = [];
  let error: string | null = null;

  try {
    const stores = await queryD1<StoreRow>(
      "SELECT id_store, name, description, address, location, stars, fk_category FROM stores ORDER BY id_store ASC"
    );

    locations = stores.map((store) => ({
      id: store.id_store,
      name: store.name,
      description:
        store.description ??
        (store.stars != null
          ? `Local con calificacion promedio de ${store.stars} estrellas.`
          : "Sin descripción disponible."),
      city:
        extractCityFromAddress(store.address) ??
        store.address ??
        store.location ??
        "Ciudad no especificada",
      category:
        store.fk_category != null
          ? (CATEGORY_LABELS[store.fk_category] ?? `Cat. ${store.fk_category}`)
          : "Sin categoría",
    }));
  } catch (e) {
    if (e instanceof CloudflareD1Error) {
      error = e.message;
    } else {
      error = "No se pudieron cargar los locales.";
    }
  }

  return (
    <section id="tiendas" className="relative z-10 w-full bg-[color:var(--guander-cream)] py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--guander-ink)]">
            Locales y Profesionales Adheridos
          </h2>
          <p className="text-sm text-[color:var(--guander-muted)] max-w-2xl">
            Filtra por categoría y encuentra rápidamente el lugar ideal para tu mascota.
          </p>
        </div>

        {error ? (
          <div className="border border-red-300 bg-red-50 text-red-600 rounded-xl p-4 text-sm">
            {error}
          </div>
        ) : (
          <LocationsFilterClient locations={locations} />
        )}
      </div>
    </section>
  );
}

import { queryD1, CloudflareD1Error } from "@/lib/cloudflare-d1";
import LocationsFilterClient, { type LocationItem } from "./LocationsFilterClient";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

interface StoreRow {
  id_store: number;
  name: string;
  description: string | null;
  address: string | null;
  location: string | null;
  stars: number | null;
  fk_category: number | null;
  image_url: string | null;
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
  if (!address) return null;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 3) return parts[parts.length - 2];
  if (parts.length >= 2) return parts[parts.length - 1];
  return null;
}

export default async function LocationsFilterSection() {
  let locations: LocationItem[] = [];
  let error: string | null = null;

  try {
    const stores = await queryD1<StoreRow>(
      "SELECT id_store, name, description, address, location, stars, fk_category, image_url FROM stores ORDER BY id_store ASC"
    );
    locations = stores.map((store) => ({
      id: store.id_store,
      name: store.name,
      image: store.image_url ?? null,
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
    error = e instanceof CloudflareD1Error ? e.message : "No se pudieron cargar los locales.";
  }

  return (
    <Box
      id="tiendas"
      component="section"
      sx={{ bgcolor: 'background.default', py: { xs: 7, md: 10 }, width: '100%' }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 1.5 }}>
            Locales y Profesionales Adheridos
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560, mx: 'auto' }}>
            Filtra por categoría y encuentra rápidamente el lugar ideal para tu mascota.
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
        ) : (
          <LocationsFilterClient locations={locations} />
        )}
      </Container>
    </Box>
  );
}

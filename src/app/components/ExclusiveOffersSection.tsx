import { queryD1, CloudflareD1Error } from "@/lib/cloudflare-d1";
import ExclusiveOffersClient, { type OfferCardItem } from "./ExclusiveOffersClient";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

interface BenefitRow {
  id_benefit_prof?: number;
  id_benefit_store?: number;
  description?: string;
  percentage?: number | null;
  entity_name?: string;
  entity_address?: string;
  entity_category?: string;
}

function toOfferItems(rows: BenefitRow[], source: "Profesional" | "Tienda"): OfferCardItem[] {
  return rows.map((row, index) => {
    const percentage = typeof row.percentage === "number" ? row.percentage : null;
    const id =
      row.id_benefit_prof ??
      row.id_benefit_store ??
      (source === "Profesional" ? 10_000 + index : 20_000 + index);
    return {
      id,
      title: percentage != null ? `${percentage}% de descuento` : "Beneficio especial",
      subtitle: row.description?.trim() || "Promoción disponible para dueños de mascotas.",
      tag: source,
      entityName: row.entity_name?.trim() || undefined,
      entityCategory: row.entity_category?.trim() || undefined,
      entityAddress: row.entity_address?.trim() || undefined,
    };
  });
}

async function loadOffersFromD1(): Promise<OfferCardItem[]> {
  const [profResult, storeResult] = await Promise.allSettled([
    queryD1<BenefitRow>(`
      SELECT
        bp.id_benefit_prof,
        bp.description,
        bp.percentage,
        ud.name || ' ' || ud.last_name AS entity_name,
        p.address                       AS entity_address,
        ts.name                         AS entity_category
      FROM benefit_prof bp
      JOIN professionals p  ON bp.fk_professional = p.id_professional
      JOIN users u          ON p.fk_user_id        = u.id_user
      JOIN user_data ud     ON u.fk_user_data       = ud.id_user_data
      JOIN type_service ts  ON p.fk_type_service    = ts.id_type_service
      ORDER BY bp.id_benefit_prof DESC
      LIMIT 20
    `),
    queryD1<BenefitRow>(`
      SELECT
        bs.id_benefit_store,
        bs.description,
        bs.percentage,
        s.name      AS entity_name,
        s.address   AS entity_address,
        c.name      AS entity_category
      FROM benefit_store bs
      JOIN stores s    ON bs.fk_store      = s.id_store
      JOIN category c  ON s.fk_category    = c.id_category
      ORDER BY bs.id_benefit_store DESC
      LIMIT 20
    `),
  ]);
  const profRows = profResult.status === "fulfilled" ? profResult.value : [];
  const storeRows = storeResult.status === "fulfilled" ? storeResult.value : [];
  if (profRows.length === 0 && storeRows.length === 0) {
    if (profResult.status === "rejected") throw profResult.reason;
    if (storeResult.status === "rejected") throw storeResult.reason;
  }
  return interleave(toOfferItems(profRows, "Profesional"), toOfferItems(storeRows, "Tienda"));
}

function interleave(a: OfferCardItem[], b: OfferCardItem[]): OfferCardItem[] {
  const result: OfferCardItem[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
}

export default async function ExclusiveOffersSection() {
  let offers: OfferCardItem[] = [];
  let error: string | null = null;

  try {
    offers = await loadOffersFromD1();
  } catch (e) {
    error = e instanceof CloudflareD1Error ? e.message : "No se pudieron cargar las promociones.";
  }

  return (
    <Box
      component="section"
      sx={{ bgcolor: '#f0f2fc', py: { xs: 7, md: 10 }, width: '100%' }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4 } }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontSize: { xs: '1.75rem', sm: '2.25rem' }, mb: 1.5 }}>
            Ofertas exclusivas para dueños
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560, mx: 'auto' }}>
            Beneficios especiales para consentir a tu mascota mientras ahorrás.
          </Typography>
        </Box>

        {error ? (
          <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>
        ) : (
          <ExclusiveOffersClient offers={offers} />
        )}
      </Container>
    </Box>
  );
}

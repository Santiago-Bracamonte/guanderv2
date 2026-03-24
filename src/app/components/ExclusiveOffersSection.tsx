import { queryD1, CloudflareD1Error } from "@/lib/cloudflare-d1";
import ExclusiveOffersClient, { type OfferCardItem } from "./ExclusiveOffersClient";

interface BenefitRow {
  id?: number;
  id_benefit_prof?: number;
  id_benefit_store?: number;
  title?: string;
  name?: string;
  description?: string;
  percentage?: number | null;
  fk_store?: number | null;
  fk_professional?: number | null;
  tag?: string;
}

function toOfferItems(rows: BenefitRow[], source: "Profesional" | "Tienda"): OfferCardItem[] {
  return rows
    .map((row, index) => {
      const description = row.description?.trim();
      const percentage = typeof row.percentage === "number" ? row.percentage : null;
      const entityName = row.name?.trim() || row.title?.trim();

      const fallbackTitle =
        source === "Profesional"
          ? "Beneficio para servicios profesionales"
          : "Beneficio para tiendas";

      const id =
        row.id_benefit_prof ??
        row.id_benefit_store ??
        row.id ??
        (source === "Profesional" ? 10_000 + index : 20_000 + index);

      return {
        id,
        title:
          percentage != null
            ? `${percentage}% de descuento${entityName ? ` en ${entityName}` : ""}`
            : entityName || fallbackTitle,
        subtitle:
          description ||
          (source === "Profesional"
            ? "Promocion disponible para duenios de mascotas."
            : "Oferta exclusiva en establecimientos aliados."),
        tag: source,
      };
    })
    .slice(0, 4);
}

async function loadOffersFromD1(): Promise<OfferCardItem[]> {
  const [profResult, storeResult] = await Promise.allSettled([
    queryD1<BenefitRow>("SELECT * FROM benefit_prof ORDER BY 1 DESC LIMIT 8"),
    queryD1<BenefitRow>("SELECT * FROM benefit_store ORDER BY 1 DESC LIMIT 8"),
  ]);

  const profRows = profResult.status === "fulfilled" ? profResult.value : [];
  const storeRows = storeResult.status === "fulfilled" ? storeResult.value : [];

  if (profRows.length === 0 && storeRows.length === 0) {
    if (profResult.status === "rejected") {
      throw profResult.reason;
    }
    if (storeResult.status === "rejected") {
      throw storeResult.reason;
    }
  }

  return [...toOfferItems(profRows, "Profesional"), ...toOfferItems(storeRows, "Tienda")].slice(0, 4);
}

export default async function ExclusiveOffersSection() {
  let offers: OfferCardItem[] = [];
  let error: string | null = null;

  try {
    offers = await loadOffersFromD1();
  } catch (e) {
    if (e instanceof CloudflareD1Error) {
      error = e.message;
    } else {
      error = "No se pudieron cargar las promociones.";
    }
  }

  return (
    <section className="relative z-10 w-full bg-[color:var(--guander-cream)] px-6 pb-16">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-[color:var(--guander-ink)]">
            Ofertas Exclusivas para Dueños
          </h2>
          <p className="text-sm text-[color:var(--guander-muted)] max-w-2xl">
            Beneficios especiales para consentir a tu mascota mientras ahorras.
          </p>
        </div>

        {error && (
          <div className="border border-red-300 bg-red-50 text-red-600 rounded-xl p-4 text-sm mb-6">
            {error}
          </div>
        )}

        {!error && offers.length > 0 && <ExclusiveOffersClient offers={offers} />}

        {!error && offers.length === 0 && (
          <p className="text-center text-sm text-[color:var(--guander-muted)]">No hay promociones disponibles por ahora.</p>
        )}
      </div>
    </section>
  );
}

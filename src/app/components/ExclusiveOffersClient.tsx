"use client";

import { useMemo, useState } from "react";

export interface OfferCardItem {
  id: number;
  title: string;
  subtitle: string;
  tag: "Profesional" | "Tienda";
}

interface ExclusiveOffersClientProps {
  offers: OfferCardItem[];
}

const FILTERS = ["Todas", "Profesional", "Tienda"] as const;
type OfferFilter = (typeof FILTERS)[number];

export default function ExclusiveOffersClient({ offers }: ExclusiveOffersClientProps) {
  const [activeFilter, setActiveFilter] = useState<OfferFilter>("Todas");

  const filteredOffers = useMemo(() => {
    if (activeFilter === "Todas") {
      return offers;
    }

    return offers.filter((offer) => offer.tag === activeFilter);
  }, [activeFilter, offers]);

  const counter = useMemo(() => {
    return {
      Todas: offers.length,
      Profesional: offers.filter((offer) => offer.tag === "Profesional").length,
      Tienda: offers.filter((offer) => offer.tag === "Tienda").length,
    };
  }, [offers]);

  return (
    <>
      <div className="mb-7 rounded-3xl border border-[color:var(--guander-border)] bg-[color:var(--guander-card)] p-4 sm:p-5 pointer-events-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[color:var(--guander-forest)]">
            Filtrar beneficios
          </h3>
          <p className="text-xs font-semibold text-[color:var(--guander-muted)]">
            {filteredOffers.length} ofertas activas
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 pointer-events-auto">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              aria-pressed={activeFilter === filter}
              className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 pointer-events-auto ${
                activeFilter === filter
                  ? "border-[color:var(--guander-forest)] bg-[color:var(--guander-forest)] text-white"
                  : "border-[color:var(--guander-border)] bg-white text-[color:var(--guander-forest)]"
              }`}
            >
              {filter} ({counter[filter]})
            </button>
          ))}
        </div>
      </div>

      {filteredOffers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredOffers.map((offer, index) => (
            <article
              key={offer.id}
              className="group relative overflow-hidden rounded-2xl border border-[color:var(--guander-border)] bg-[color:var(--guander-card)] p-5 shadow-[0_8px_24px_rgba(23,58,45,0.08)] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute -right-5 -top-5 h-16 w-16 rounded-full bg-[color:var(--guander-mint)] opacity-45 transition-transform duration-300 group-hover:scale-125" />

              <div className="relative mb-4 flex items-center justify-between gap-2">
                <span className="inline-flex text-[10px] px-2.5 py-1 rounded-full bg-[color:var(--guander-forest)] text-white font-black uppercase tracking-wide">
                  {offer.tag}
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--guander-sand)]">
                  #{index + 1}
                </span>
              </div>

              <h3 className="relative text-sm font-extrabold text-[color:var(--guander-ink)] mb-2 leading-snug">
                {offer.title}
              </h3>
              <p className="relative text-xs text-[color:var(--guander-muted)] leading-relaxed">
                {offer.subtitle}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-[color:var(--guander-border)] p-8 text-center bg-[color:var(--guander-card)]">
          <p className="text-sm font-semibold text-[color:var(--guander-muted)]">
            No hay beneficios para este filtro en este momento.
          </p>
        </div>
      )}
    </>
  );
}

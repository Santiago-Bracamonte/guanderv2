"use client";

import { useState } from "react";

export interface LocationItem {
  id: number;
  name: string;
  description: string;
  category: string;
  city: string;
}

interface LocationsFilterClientProps {
  locations: LocationItem[];
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export default function LocationsFilterClient({ locations }: LocationsFilterClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

  const distinct = Array.from(new Set(locations.map((location) => location.category)));
  const categories = ["Todos", ...distinct];

  const categoryCount = locations.reduce<Record<string, number>>((acc, location) => {
    acc[location.category] = (acc[location.category] ?? 0) + 1;
    return acc;
  }, { Todos: locations.length });

  const normalizedTerm = normalizeText(searchTerm);
  const filteredLocations = locations.filter((location) => {
    const inCategory = activeCategory === "Todos" || location.category === activeCategory;

    if (!inCategory) {
      return false;
    }

    if (!normalizedTerm) {
      return true;
    }

    return (
      normalizeText(location.name).includes(normalizedTerm) ||
      normalizeText(location.city).includes(normalizedTerm) ||
      normalizeText(location.description).includes(normalizedTerm)
    );
  });

  const hasActiveFilters = activeCategory !== "Todos" || searchTerm.trim().length > 0;

  return (
    <>
      <div className="rounded-3xl border border-[color:var(--guander-border)] bg-[color:var(--guander-card)] p-4 sm:p-5 mb-6 pointer-events-auto">
        <div className="flex flex-col gap-4 pointer-events-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-[color:var(--guander-forest)]">
              Explora locales
            </h3>
            <div className="text-xs font-semibold text-[color:var(--guander-muted)]">
              {filteredLocations.length} resultados
            </div>
          </div>

          <p className="text-xs font-semibold text-[color:var(--guander-muted)]">
            Filtro activo: {activeCategory}
          </p>

          <div className="lg:hidden">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              aria-expanded={mobileFiltersOpen}
              className="flex w-full items-center justify-between rounded-2xl border border-[color:var(--guander-border)] bg-white px-4 py-3 text-left"
            >
              <span className="text-xs font-black uppercase tracking-[0.12em] text-[color:var(--guander-forest)]">
                Filtros
              </span>
              <span className="text-xs font-semibold text-[color:var(--guander-muted)]">
                {mobileFiltersOpen ? "Ocultar" : "Mostrar"}
              </span>
            </button>

            {mobileFiltersOpen && (
              <div className="mt-3 space-y-3 rounded-2xl border border-[color:var(--guander-border)] bg-white p-3">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--guander-muted)]">
                    Buscar
                  </span>
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Nombre, ciudad o descripcion"
                    className="w-full rounded-xl border border-[color:var(--guander-border)] bg-white px-3 py-2.5 text-sm text-[color:var(--guander-ink)] placeholder:text-[#40564d] outline-none focus:border-[color:var(--guander-forest)] focus:ring-2 focus:ring-[color:var(--guander-mint)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--guander-muted)]">
                    Categoria
                  </span>
                  <select
                    value={activeCategory}
                    onChange={(event) => setActiveCategory(event.target.value)}
                    className="w-full rounded-xl border border-[color:var(--guander-border)] bg-white px-3 py-2.5 text-sm text-[color:var(--guander-ink)] outline-none focus:border-[color:var(--guander-forest)] focus:ring-2 focus:ring-[color:var(--guander-mint)]"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category} ({categoryCount[category] ?? 0})
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  disabled={!hasActiveFilters}
                  onClick={() => {
                    setActiveCategory("Todos");
                    setSearchTerm("");
                  }}
                  className="w-full rounded-xl bg-[color:var(--guander-forest)] px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.12em] text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
            <label className="flex items-center pointer-events-auto">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre, ciudad o descripcion"
                className="w-full rounded-2xl border border-[color:var(--guander-border)] bg-white px-4 py-3 text-sm text-[color:var(--guander-ink)] placeholder:text-[#40564d] outline-none focus:border-[color:var(--guander-forest)] focus:ring-2 focus:ring-[color:var(--guander-mint)] pointer-events-auto"
              />
            </label>

            <button
              type="button"
              disabled={!hasActiveFilters}
              onClick={() => {
                setActiveCategory("Todos");
                setSearchTerm("");
              }}
              className="cursor-pointer rounded-2xl bg-[color:var(--guander-forest)] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 pointer-events-auto"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 flex-wrap pointer-events-auto">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`group cursor-pointer rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] transition-all hover:-translate-y-0.5 pointer-events-auto ${
                  activeCategory === category
                    ? "border-[color:var(--guander-forest)] bg-[color:var(--guander-forest)] text-white"
                    : "border-[color:var(--guander-border)] bg-white text-[color:var(--guander-forest)]"
                }`}
              >
                {category} ({categoryCount[category] ?? 0})
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredLocations.map((location) => (
          <article
            key={location.id}
            className="group relative overflow-hidden rounded-2xl border border-[color:var(--guander-border)] bg-[color:var(--guander-card)] p-5 shadow-[0_8px_24px_rgba(23,58,45,0.08)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="pointer-events-none absolute right-4 top-4 h-8 w-8 rounded-full bg-[color:var(--guander-mint)] opacity-50 transition-all duration-300 group-hover:scale-125" />
            <div className="relative flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-extrabold text-[color:var(--guander-ink)]">{location.name}</h3>
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-[color:var(--guander-mint)] text-[color:var(--guander-forest)] font-black uppercase tracking-wide">
                {location.category}
              </span>
            </div>
            <p className="text-xs text-[color:var(--guander-muted)] leading-relaxed mb-4 relative">{location.description}</p>
            <p className="text-xs font-bold text-[color:var(--guander-forest)]">{location.city}</p>
          </article>
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-[color:var(--guander-border)] p-8 text-center bg-[color:var(--guander-card)]">
          <p className="text-sm font-semibold text-[color:var(--guander-muted)]">
            No encontramos locales con esos filtros. Prueba otra categoria o termino de busqueda.
          </p>
        </div>
      )}
    </>
  );
}

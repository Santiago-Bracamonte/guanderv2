"use client";

import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import Pagination from "@mui/material/Pagination";
import L from "leaflet";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";

const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  Veterinaria: { from: "#166534", to: "#34d399" },
  "Pet Shop": { from: "#1d7a4f", to: "#43D696" },
  "Cafetería": { from: "#b45309", to: "#f59e0b" },
  Restaurante: { from: "#be185d", to: "#f472b6" },
  Grooming: { from: "#7c3aed", to: "#a78bfa" },
  Resort: { from: "#0f766e", to: "#34d399" },
};

export interface LocationItem {
  id: number;
  name: string;
  description: string;
  category: string;
  city: string;
  address: string | null;
  location: string | null;
  image: string | null;
}

interface LocationsFilterClientProps {
  locations: LocationItem[];
}

function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

type MarkerPoint = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  description: string;
  addressLabel: string;
  image: string | null;
};

const guanderIcon = L.icon({
  iconUrl: "/Marcador.png",
  iconSize: [52, 52],
  iconAnchor: [26, 32],
  popupAnchor: [0, -28],
});

function parseLatLng(raw: string | null): { lat: number; lng: number } | null {
  if (!raw) return null;
  const parts = raw.split(",").map((value) => Number(value.trim()));
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeImageUrl(value: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as
        | { url?: string; image_url?: string; secure_url?: string }
        | Array<{ url?: string; image_url?: string; secure_url?: string }>;

      if (Array.isArray(parsed)) {
        const first = parsed[0];
        const candidate = first?.url ?? first?.secure_url ?? first?.image_url;
        return candidate ? encodeURI(candidate) : null;
      }

      const candidate = parsed.url ?? parsed.secure_url ?? parsed.image_url;
      return candidate ? encodeURI(candidate) : null;
    } catch {
      return null;
    }
  }

  return encodeURI(trimmed);
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(address)}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;

  const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
  const first = data[0];
  if (!first?.lat || !first?.lon) return null;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function StoresMap({
  locations,
  selectedLocationId,
  onMarkerSelect,
}: {
  locations: LocationItem[];
  selectedLocationId: number | null;
  onMarkerSelect: (id: number) => void;
}) {
  const [points, setPoints] = useState<MarkerPoint[]>([]);
  const [resolving, setResolving] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerByIdRef = useRef<Map<number, L.Marker>>(new Map());

  useEffect(() => {
    let cancelled = false;

    async function resolvePoints() {
      setResolving(true);
      const collected: MarkerPoint[] = [];

      for (const item of locations) {
        const direct = parseLatLng(item.location);
        if (direct) {
          collected.push({
            id: item.id,
            name: item.name,
            lat: direct.lat,
            lng: direct.lng,
            description: item.description,
            addressLabel: item.address ?? item.city,
            image: normalizeImageUrl(item.image),
          });
          continue;
        }

        const queryAddress = item.address ?? item.city;
        if (!queryAddress) continue;

        const resolved = await geocodeAddress(queryAddress);
        if (!resolved) continue;

        collected.push({
          id: item.id,
          name: item.name,
          lat: resolved.lat,
          lng: resolved.lng,
          description: item.description,
          addressLabel: queryAddress,
          image: normalizeImageUrl(item.image),
        });
      }

      if (!cancelled) {
        setPoints(collected);
        setResolving(false);
      }
    }

    void resolvePoints();

    return () => {
      cancelled = true;
    };
  }, [locations]);

  useEffect(() => {
    if (!mapContainerRef.current || points.length === 0) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        center: [-34.6037, -58.3816],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);
    }

    const map = mapRef.current;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
    markerByIdRef.current.clear();

    const bounds = L.latLngBounds([]);

    points.forEach((point) => {
      const marker = L.marker([point.lat, point.lng], { icon: guanderIcon });
      marker.on("click", () => onMarkerSelect(point.id));
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
      const imageHtml = point.image
        ? `<img
              src="${escapeHtml(point.image)}"
              alt="${escapeHtml(point.name)}"
              style="width:100%;height:100px;object-fit:cover;border-radius:10px;border:1px solid rgba(23,58,45,0.12);margin-bottom:8px;"
            />`
        : "";
      const photoLinkHtml = point.image
        ? `<a
            href="${escapeHtml(point.image)}"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block;margin-top:9px;padding:8px 12px;border-radius:999px;background:linear-gradient(135deg,#166534 0%,#34d399 100%);color:#ffffff;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:0.01em;box-shadow:0 6px 16px rgba(22,101,52,0.3);border:1px solid rgba(255,255,255,0.32);"
          >
            Ver foto completa ↗
          </a>`
        : "";
      marker.bindPopup(
        `<div style="min-width:190px;max-width:260px;">
          ${imageHtml}
          <div style="font-weight:800;color:#173a2d;">${escapeHtml(point.name)}</div>
          <div style="font-size:12px;color:#35584a;margin-top:4px;">${escapeHtml(point.addressLabel)}</div>
          <div style="font-size:12px;margin-top:6px;">${escapeHtml(point.description)}</div>
          ${photoLinkHtml}
          <a
            href="${directionsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            style="display:inline-block;margin-top:10px;padding:8px 10px;border-radius:10px;background:#173a2d;color:#ffffff;text-decoration:none;font-size:12px;font-weight:700;"
          >
            Ver ruta
          </a>
        </div>`,
      );
      marker.addTo(map);
      markerByIdRef.current.set(point.id, marker);
      bounds.extend([point.lat, point.lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [28, 28] });
    }

    // Force recalculation after layout settles to avoid partially rendered tiles.
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 120);
  }, [onMarkerSelect, points]);

  useEffect(() => {
    if (!selectedLocationId || !mapRef.current) return;
    const marker = markerByIdRef.current.get(selectedLocationId);
    if (!marker) return;

    const map = mapRef.current;
    const latLng = marker.getLatLng();
    const nextZoom = Math.max(map.getZoom(), 15);
    map.flyTo(latLng, nextZoom, { duration: 0.65 });
    marker.openPopup();
  }, [selectedLocationId]);

  useEffect(() => {
    const container = mapContainerRef.current;
    const map = mapRef.current;
    if (!container || !map) return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [points.length]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  if (resolving) {
    return (
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ py: 6, textAlign: "center" }}>
          <CircularProgress size={26} />
          <Typography variant="body2" sx={{ mt: 1.2 }}>
            Cargando mapa de locales...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (points.length === 0) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 3 }}>
        No se encontraron coordenadas válidas para mostrar los locales en el mapa.
      </Alert>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        border: "1px solid rgba(22,101,52,0.18)",
        borderRadius: 2,
        overflow: "hidden",
        background: "linear-gradient(180deg, rgba(237,248,242,0.96) 0%, rgba(255,255,255,0.98) 32%, #fff 100%)",
        boxShadow: "0 16px 38px rgba(22,101,52,0.1)",
      }}
    >
      <CardContent sx={{ p: { xs: 1.4, sm: 1.8 }, "&:last-child": { pb: { xs: 1.4, sm: 1.8 } } }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 900,
            color: "#173a2d",
            mb: 0.7,
            letterSpacing: "0.01em",
          }}
        >
          Mapa de locales adheridos
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.4 }}>
          Navega el mapa, haz zoom y toca los marcadores para ver el detalle del local.
        </Typography>

        <Box
          ref={mapContainerRef}
          sx={{
            width: "100%",
            height: "clamp(300px, 44vh, 430px)",
            borderRadius: 0,
            overflow: "hidden",
            border: "1px solid rgba(22,101,52,0.2)",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.45), 0 8px 24px rgba(17,24,39,0.12)",
          }}
        />
      </CardContent>
    </Card>
  );
}

export default function LocationsFilterClient({ locations }: LocationsFilterClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);

  const distinct = Array.from(new Set(locations.map((l) => l.category)));
  const categories = ["Todos", ...distinct];

  const categoryCount = locations.reduce<Record<string, number>>((acc, l) => {
    acc[l.category] = (acc[l.category] ?? 0) + 1;
    return acc;
  }, { Todos: locations.length });

  const normalizedTerm = normalizeText(searchTerm);
  const filteredLocations = locations.filter((l) => {
    const inCategory = activeCategory === "Todos" || l.category === activeCategory;
    if (!inCategory) return false;
    if (!normalizedTerm) return true;
    return (
      normalizeText(l.name).includes(normalizedTerm) ||
      normalizeText(l.city).includes(normalizedTerm) ||
      normalizeText(l.description).includes(normalizedTerm)
    );
  });

  useEffect(() => {
    setPage(1);
    setSelectedLocationId(null);
  }, [activeCategory, searchTerm]);

  const pageSize = 6;
  const totalPages = Math.max(1, Math.ceil(filteredLocations.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedLocations = filteredLocations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const hasActiveFilters = activeCategory !== "Todos" || searchTerm.trim().length > 0;

  return (
    <>
      <Card variant="outlined" sx={{ mb: 3, border: "1px solid", borderColor: "rgba(22,101,52,0.14)" }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, "&:last-child": { pb: { xs: 2.5, sm: 3 } } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "center" },
              justifyContent: "space-between",
              gap: 1,
              mb: 2.5,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                color: "#14532d",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontSize: "0.75rem",
              }}
            >
              Explora locales
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filteredLocations.length} resultados · Filtro: {activeCategory}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 1.5, mb: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre, ciudad o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              disabled={!hasActiveFilters}
              onClick={() => {
                setActiveCategory("Todos");
                setSearchTerm("");
                setPage(1);
              }}
              sx={{
                whiteSpace: "nowrap",
                px: 3,
                py: 1,
                bgcolor: "#166534",
                "&:hover": { bgcolor: "#14532d" },
                "&.Mui-disabled": {
                  bgcolor: "rgba(22,101,52,0.25)",
                  color: "rgba(20,83,45,0.55)",
                },
              }}
            >
              Limpiar filtros
            </Button>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={`${cat} (${categoryCount[cat] ?? 0})`}
                onClick={() => setActiveCategory(cat)}
                variant={activeCategory === cat ? "filled" : "outlined"}
                size="small"
                sx={{
                  cursor: "pointer",
                  fontWeight: 700,
                  ...(activeCategory === cat
                    ? {
                        bgcolor: "#166534",
                        color: "#ffffff",
                        border: "1px solid #166534",
                        "&:hover": { bgcolor: "#14532d" },
                      }
                    : {
                        color: "#14532d",
                        border: "1px solid rgba(22,101,52,0.25)",
                        "&:hover": { bgcolor: "rgba(22,101,52,0.08)" },
                      }),
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(280px, 0.9fr) minmax(0, 1.6fr)" },
          gap: 2,
          alignItems: "start",
        }}
      >
        <Box
          sx={{
            minWidth: 0,
            position: { lg: "sticky" },
            top: { lg: 86 },
          }}
        >
          <StoresMap
            locations={filteredLocations}
            selectedLocationId={selectedLocationId}
            onMarkerSelect={setSelectedLocationId}
          />
        </Box>

        <Box
          sx={{
            minWidth: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(2, minmax(0, 1fr))" },
            gap: 1.5,
          }}
        >
          {paginatedLocations.map((location) => {
            return (
              <Card
                key={location.id}
                variant="outlined"
                onClick={() => setSelectedLocationId(location.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelectedLocationId(location.id);
                  }
                }}
                role="button"
                tabIndex={0}
                sx={{
                  border: "1px solid rgba(22,101,52,0.13)",
                  overflow: "hidden",
                  borderRadius: 2,
                  background: "linear-gradient(180deg, #ffffff 0%, #f4fbf7 100%)",
                  boxShadow:
                    selectedLocationId === location.id
                      ? "0 14px 34px rgba(22,101,52,0.2)"
                      : "0 6px 16px rgba(22,101,52,0.1)",
                  transition: "transform 0.25s, box-shadow 0.25s, border-color 0.25s",
                  cursor: "pointer",
                  borderColor:
                    selectedLocationId === location.id
                      ? "rgba(22,101,52,0.34)"
                      : "rgba(22,101,52,0.13)",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 14px 34px rgba(22,101,52,0.18)",
                    borderColor: "rgba(22,101,52,0.28)",
                  },
                  "&:focus-visible": {
                    outline: "2px solid #166534",
                    outlineOffset: 2,
                  },
                }}
              >
                <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 0.75 }}>
                    <Chip
                      label={location.category}
                      size="small"
                      sx={{
                        bgcolor: "rgba(22,101,52,0.1)",
                        color: "#166534",
                        fontWeight: 800,
                        fontSize: "0.65rem",
                        border: "1px solid rgba(22,101,52,0.18)",
                      }}
                    />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: "0.9rem", lineHeight: 1.25, mb: 0.75 }}>
                    {location.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 1.25,
                      lineHeight: 1.45,
                      fontSize: "0.92rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {location.description}
                  </Typography>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 0.9,
                      py: 0.45,
                      borderRadius: 99,
                      bgcolor: "rgba(22,101,52,0.09)",
                    }}
                  >
                    <LocationOnIcon sx={{ fontSize: 13, color: "#166534" }} />
                    <Typography variant="caption" sx={{ color: "#166534", fontWeight: 700 }}>
                      {location.city}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}

          {filteredLocations.length > pageSize && (
            <Box
              sx={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "center",
                pt: 0.5,
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, value) => setPage(value)}
                shape="rounded"
                size="small"
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: "#14532d",
                    borderColor: "rgba(22,101,52,0.25)",
                  },
                  "& .MuiPaginationItem-root.Mui-selected": {
                    bgcolor: "#166534",
                    color: "#fff",
                    borderColor: "#166534",
                    "&:hover": { bgcolor: "#14532d" },
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>

      {filteredLocations.length === 0 && (
        <Box
          sx={{
            mt: 3,
            p: 5,
            textAlign: "center",
            border: "2px dashed",
            borderColor: "rgba(22,101,52,0.2)",
            borderRadius: 2,
          }}
        >
          <Typography color="text.secondary">
            No encontramos locales con esos filtros. Prueba otra categoría o cambia el término de búsqueda.
          </Typography>
        </Box>
      )}
    </>
  );
}

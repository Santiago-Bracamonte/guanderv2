"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import L from "leaflet";
import { Search, Star, MapPin, Briefcase, X, CheckCircle, XCircle, Upload } from "lucide-react";

export interface ProfessionalItem {
  id: number;
  name: string;
  email: string;
  serviceType: string;
  serviceTypeId: number;
  description: string;
  address: string;
  location: string;
  stars: number | null;
  acceptsPoints: boolean;
  scheduleId: number | null;
  scheduleWeek: string;
  scheduleWeekend: string;
  scheduleSunday: string;
  imageUrl: string;
}

interface ServiceType {
  id_type_service: number;
  name: string;
}

interface GeocodeSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

const CLOUD_NAME = "dwckkyqpw";
const UPLOAD_PRESET = "guander_unsigned";

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", "guander/profesionales");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: fd },
  );
  const data = (await res.json()) as { secure_url?: string; error?: { message: string } };
  if (!res.ok || !data.secure_url) throw new Error(data.error?.message ?? "Upload failed");
  return data.secure_url;
}

const pickerMarkerIcon =
  typeof window !== "undefined"
    ? L.icon({ iconUrl: "/Marcador.png", iconSize: [52, 52], iconAnchor: [26, 32] })
    : null;

const PLACEHOLDER_AVATARS = [
  "https://placehold.co/400x200/1f4b3b/ffffff?text=Profesional",
  "https://placehold.co/400x200/3d6b4f/ffffff?text=Profesional",
  "https://placehold.co/400x200/7d8b6a/ffffff?text=Profesional",
  "https://placehold.co/400x200/3d6b6b/ffffff?text=Profesional",
  "https://placehold.co/400x200/173a2d/ffffff?text=Profesional",
  "https://placehold.co/400x200/5a7a5a/ffffff?text=Profesional",
];

function parseLatLng(raw: string): { lat: number; lng: number } | null {
  if (!raw) return null;
  const parts = raw.split(",").map((v) => Number(v.trim()));
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function Modal({
  open,
  onClose,
  children,
  maxWidthClass = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={`relative bg-white rounded-2xl w-full ${maxWidthClass} max-h-[90vh] overflow-y-auto`}
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function MapLocationPicker({
  open,
  initialLocation,
  onClose,
  onConfirm,
}: {
  open: boolean;
  initialLocation: string;
  onClose: () => void;
  onConfirm: (payload: { location: string; address: string }) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [resolvingAddress, setResolvingAddress] = useState(false);

  useEffect(() => {
    if (!open || !mapContainerRef.current) return;

    const initial = parseLatLng(initialLocation) ?? { lat: -34.603722, lng: -58.381592 };
    setSelectedLocation(initial);
    let cancelled = false;

    const reverseGeocode = async (lat: number, lng: number) => {
      setResolvingAddress(true);
      try {
        const res = await fetch(`/api/admin/locales/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (!res.ok) { setSelectedAddress(""); return; }
        const data = (await res.json()) as { address?: string };
        setSelectedAddress(data.address ?? "");
      } catch {
        setSelectedAddress("");
      } finally {
        if (!cancelled) setResolvingAddress(false);
      }
    };

    const icon = pickerMarkerIcon ?? L.icon({ iconUrl: "/Marcador.png", iconSize: [52, 52], iconAnchor: [26, 32] });
    const map = L.map(mapContainerRef.current, { zoomControl: true, scrollWheelZoom: true });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    map.setView([initial.lat, initial.lng], 15);
    const marker = L.marker([initial.lat, initial.lng], { draggable: true, icon }).addTo(map);
    markerRef.current = marker;
    void reverseGeocode(initial.lat, initial.lng);

    const updateLocation = (lat: number, lng: number) => {
      marker.setLatLng([lat, lng]);
      setSelectedLocation({ lat, lng });
      void reverseGeocode(lat, lng);
    };
    map.on("click", (e: L.LeafletMouseEvent) => updateLocation(e.latlng.lat, e.latlng.lng));
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      updateLocation(pos.lat, pos.lng);
    });
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 120);

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [open, initialLocation]);

  return (
    <Modal open={open} onClose={onClose} maxWidthClass="max-w-4xl">
      <div className="p-6 pb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ color: "var(--guander-ink)" }}>
          Elegir ubicación en mapa
        </h2>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">
          <X size={16} />
        </button>
      </div>
      <div className="px-6 pb-4 space-y-3">
        <p className="text-sm" style={{ color: "var(--guander-muted)" }}>
          Haz click en el mapa o arrastra el pin para ajustar la ubicación.
        </p>
        <div ref={mapContainerRef} className="w-full rounded-xl overflow-hidden" style={{ border: "1px solid var(--guander-border)", minHeight: "380px" }} />
        <div className="rounded-xl p-3" style={{ border: "1px solid var(--guander-border)", backgroundColor: "var(--guander-cream)" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "var(--guander-muted)" }}>Ubicación seleccionada</p>
          <p className="text-sm" style={{ color: "var(--guander-ink)" }}>
            {selectedLocation ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` : "Selecciona un punto"}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--guander-muted)" }}>
            {resolvingAddress ? "Buscando dirección..." : selectedAddress || "No se pudo resolver la dirección."}
          </p>
        </div>
      </div>
      <div className="p-6 pt-2 flex gap-3">
        <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90" style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}>
          Cancelar
        </button>
        <button
          onClick={() => {
            if (!selectedLocation) return;
            onConfirm({ location: `${selectedLocation.lat.toFixed(6)},${selectedLocation.lng.toFixed(6)}`, address: selectedAddress });
          }}
          disabled={!selectedLocation}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--guander-forest)" }}
        >
          Confirmar ubicación
        </button>
      </div>
    </Modal>
  );
}

function StarRating({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: "var(--guander-muted)" }} className="text-sm">Sin calificación</span>;
  return (
    <span className="flex items-center gap-1">
      <Star size={14} className="fill-amber-400 text-amber-400" />
      <span className="text-sm font-bold" style={{ color: "var(--guander-ink)" }}>{value.toFixed(1)}</span>
    </span>
  );
}

export default function ProfesionalesClient({ initialProfessionals }: { initialProfessionals: ProfessionalItem[] }) {
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>(initialProfessionals);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("Todos");
  const [viewProfessional, setViewProfessional] = useState<ProfessionalItem | null>(null);
  const [editProfessional, setEditProfessional] = useState<ProfessionalItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const ITEMS_PER_PAGE = 8;

  /* ── Edit form state ── */
  const [formDescription, setFormDescription] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formStars, setFormStars] = useState("");
  const [formAcceptsPoints, setFormAcceptsPoints] = useState(false);
  const [formServiceTypeId, setFormServiceTypeId] = useState(1);
  const [formWeek, setFormWeek] = useState("");
  const [formWeekend, setFormWeekend] = useState("");
  const [formSunday, setFormSunday] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  /* ── Load service types ── */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/profesionales");
        const data = (await res.json()) as { serviceTypes?: ServiceType[] };
        if (data.serviceTypes && data.serviceTypes.length > 0) setServiceTypes(data.serviceTypes);
      } catch { /* keep empty */ }
    };
    void load();
  }, []);

  /* ── Address autocomplete ── */
  useEffect(() => {
    if (!editProfessional) return;
    const query = formAddress.trim();
    if (query.length < 4) { setAddressSuggestions([]); setIsSearchingAddress(false); return; }
    const id = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await fetch(`/api/admin/locales/geocode?q=${encodeURIComponent(query)}`);
        if (!res.ok) { setAddressSuggestions([]); return; }
        const data = (await res.json()) as { suggestions?: GeocodeSuggestion[] };
        setAddressSuggestions(data.suggestions ?? []);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [formAddress, editProfessional]);

  const availableServiceTypes = useMemo(() => {
    const types = Array.from(new Set(professionals.map((p) => p.serviceType)));
    return ["Todos", ...types];
  }, [professionals]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return professionals.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.email.toLowerCase().includes(term) ||
        p.serviceType.toLowerCase().includes(term) ||
        p.address.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term);
      const matchesService = serviceFilter === "Todos" || p.serviceType === serviceFilter;
      return matchesSearch && matchesService;
    });
  }, [professionals, search, serviceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const openEdit = (prof: ProfessionalItem) => {
    setFormDescription(prof.description);
    setFormAddress(prof.address);
    setFormLocation(prof.location);
    setFormStars(prof.stars?.toString() ?? "");
    setFormAcceptsPoints(prof.acceptsPoints);
    setFormServiceTypeId(prof.serviceTypeId);
    setFormWeek(prof.scheduleWeek);
    setFormWeekend(prof.scheduleWeekend);
    setFormSunday(prof.scheduleSunday);
    setFormErrors({});
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setFormImageFile(null);
    setFormImagePreview(prof.imageUrl);
    setEditProfessional(prof);
  };

  const selectAddress = (s: GeocodeSuggestion) => {
    setFormAddress(s.displayName);
    setFormLocation(`${s.lat.toFixed(6)},${s.lng.toFixed(6)}`);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (formStars !== "") {
      const n = parseFloat(formStars);
      if (isNaN(n)) errors.stars = "Ingresa un número válido";
      else if (n < 0 || n > 5) errors.stars = "La valoración debe estar entre 0 y 5";
    }
    if (formLocation.trim() !== "") {
      const parts = formLocation.split(",").map((v) => parseFloat(v.trim()));
      if (parts.length !== 2 || parts.some(isNaN)) errors.location = "Formato inválido. Usa: -34.6037,-58.3816";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editProfessional) return;
    if (!validateForm()) return;
    setSaving(true);
    try {
      const chosenType = serviceTypes.find((t) => t.id_type_service === formServiceTypeId);
      let finalImageUrl = editProfessional.imageUrl;
      if (formImageFile) {
        finalImageUrl = await uploadToCloudinary(formImageFile);
      }
      await fetch("/api/admin/profesionales", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_professional: editProfessional.id,
          description: formDescription,
          address: formAddress,
          location: formLocation || null,
          stars: formStars ? parseFloat(formStars) : null,
          accept_point: formAcceptsPoints ? 1 : 0,
          fk_type_service: formServiceTypeId,
          schedule_week: formWeek.trim() || null,
          schedule_weekend: formWeekend.trim() || null,
          schedule_sunday: formSunday.trim() || null,
          image_url: finalImageUrl || null,
        }),
      });

      setProfessionals((prev) =>
        prev.map((p) =>
          p.id === editProfessional.id
            ? {
                ...p,
                description: formDescription,
                address: formAddress,
                location: formLocation,
                stars: formStars ? parseFloat(formStars) : null,
                acceptsPoints: formAcceptsPoints,
                serviceTypeId: formServiceTypeId,
                serviceType: chosenType?.name ?? p.serviceType,
                scheduleWeek: formWeek.trim(),
                scheduleWeekend: formWeekend.trim(),
                scheduleSunday: formSunday.trim(),
                imageUrl: finalImageUrl,
              }
            : p,
        ),
      );
      setEditProfessional(null);
    } catch {
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--guander-ink)" }}>
            Gestión de Profesionales
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--guander-muted)" }}>
            {filtered.length} profesional{filtered.length !== 1 ? "es" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search & filters */}
      <div className="bg-white rounded-2xl p-4 space-y-3" style={{ border: "1px solid var(--guander-border)" }}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--guander-muted)" }} />
          <input
            type="text"
            placeholder="Buscar profesional..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ border: "1px solid var(--guander-border)", backgroundColor: "var(--guander-cream)", color: "var(--guander-ink)" }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {availableServiceTypes.map((type) => (
            <button
              key={type}
              onClick={() => { setServiceFilter(type); setCurrentPage(1); }}
              className="px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer"
              style={
                serviceFilter === type
                  ? { backgroundColor: "var(--guander-forest)", color: "#fff" }
                  : { backgroundColor: "var(--guander-mint)", color: "var(--guander-ink)", border: "1px solid var(--guander-border)" }
              }
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {paginated.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ border: "1px solid var(--guander-border)" }}>
          <p style={{ color: "var(--guander-muted)" }}>No se encontraron profesionales con esos filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {paginated.map((prof, i) => (
            <div key={prof.id} className="bg-white rounded-2xl overflow-hidden flex flex-col" style={{ border: "1px solid var(--guander-border)" }}>
              <div className="relative">
                <img src={prof.imageUrl || PLACEHOLDER_AVATARS[i % PLACEHOLDER_AVATARS.length]} alt={prof.name} className="w-full h-40 object-cover" />
                <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#3d6b6b", color: "#ffffff" }}>
                  PROFESIONAL
                </span>
              </div>
              <div className="p-4 flex flex-col gap-1.5 flex-1">
                <p className="font-bold text-base leading-tight" style={{ color: "var(--guander-ink)" }}>{prof.name}</p>
                <p className="text-xs" style={{ color: "var(--guander-muted)" }}>{prof.email}</p>
                <p className="text-sm font-medium" style={{ color: "#3d6b6b" }}>{prof.serviceType}</p>
                <div className="flex items-center gap-3 mt-1">
                  <StarRating value={prof.stars} />
                  {prof.acceptsPoints ? (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#1f7a4a" }}><CheckCircle size={12} /> Acepta puntos</span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--guander-muted)" }}><XCircle size={12} /> Sin puntos</span>
                  )}
                </div>
                {prof.address && (
                  <div className="flex items-start gap-1 mt-0.5">
                    <MapPin size={12} className="mt-0.5 shrink-0" style={{ color: "var(--guander-muted)" }} />
                    <p className="text-xs leading-tight" style={{ color: "var(--guander-muted)" }}>{prof.address}</p>
                  </div>
                )}
                <div className="mt-auto pt-3 flex gap-2">
                  <button
                    onClick={() => setViewProfessional(prof)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => openEdit(prof)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90"
                    style={{ backgroundColor: "var(--guander-forest)" }}
                  >
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3" style={{ border: "1px solid var(--guander-border)" }}>
          <span className="text-sm" style={{ color: "var(--guander-muted)" }}>
            Página {safePage} de {totalPages} ({filtered.length} profesionales)
          </span>
          <div className="flex gap-2">
            <button
              disabled={safePage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90 disabled:opacity-40"
              style={{ border: "1px solid var(--guander-border)", backgroundColor: "var(--guander-cream)", color: "var(--guander-ink)" }}
            >
              Anterior
            </button>
            <button
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-40"
              style={{ backgroundColor: "var(--guander-forest)" }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* ── Map picker ── */}
      {editProfessional && (
        <MapLocationPicker
          open={showMapPicker}
          initialLocation={formLocation}
          onClose={() => setShowMapPicker(false)}
          onConfirm={({ location, address }) => {
            setFormLocation(location);
            if (address) setFormAddress(address);
            setShowMapPicker(false);
          }}
        />
      )}

      {/* ── Edit modal ── */}
      <Modal open={!!editProfessional} onClose={() => { if (!saving) setEditProfessional(null); }} maxWidthClass="max-w-xl">
        {editProfessional && (
          <>
            <div className="p-5 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: "var(--guander-ink)" }}>
                Editar Profesional — {editProfessional.name}
              </h2>
              <button onClick={() => setEditProfessional(null)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-4">
              {/* Photo */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--guander-ink)" }}>Foto</label>
                <div className="flex gap-4 items-start">
                  <div
                    className="relative w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group"
                    style={{ border: "2px dashed var(--guander-border)", backgroundColor: "var(--guander-cream)" }}
                    onClick={() => imageInputRef.current?.click()}
                  >
                    {formImagePreview ? (
                      <img src={formImagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                        <Upload size={18} style={{ color: "var(--guander-muted)" }} />
                        <span className="text-xs" style={{ color: "var(--guander-muted)" }}>Sin foto</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <Upload size={18} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
                      style={{ border: "1px solid var(--guander-border)", backgroundColor: "var(--guander-cream)", color: "var(--guander-ink)" }}
                    >
                      {formImagePreview ? "Cambiar foto" : "Subir foto"}
                    </button>
                    {formImageFile && (
                      <button
                        type="button"
                        onClick={() => { setFormImageFile(null); setFormImagePreview(editProfessional?.imageUrl ?? ""); }}
                        className="w-full py-2 rounded-xl text-xs font-semibold transition cursor-pointer hover:opacity-90"
                        style={{ color: "#ef4444" }}
                      >
                        ✕ Quitar cambio
                      </button>
                    )}
                    <p className="text-xs" style={{ color: "var(--guander-muted)" }}>
                      JPG, PNG o WEBP · Máx. 5 MB
                    </p>
                  </div>
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { alert("La imagen no puede superar 5 MB"); return; }
                    setFormImageFile(file);
                    setFormImagePreview(URL.createObjectURL(file));
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--guander-ink)" }}>Descripción</label>
                <textarea
                  value={formDescription}
                  maxLength={500}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}
                  placeholder="Descripción del profesional"
                />
                <p className="text-xs mt-0.5 text-right" style={{ color: "var(--guander-muted)" }}>{formDescription.length}/500</p>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--guander-ink)" }}>Dirección</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formAddress}
                    maxLength={300}
                    onChange={(e) => { setFormAddress(e.target.value); setShowAddressSuggestions(true); }}
                    onFocus={() => setShowAddressSuggestions(true)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}
                    placeholder="Busca la dirección..."
                  />
                  {showAddressSuggestions && (addressSuggestions.length > 0 || isSearchingAddress) && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white overflow-hidden" style={{ borderColor: "var(--guander-border)", boxShadow: "0 12px 30px rgba(0,0,0,0.12)" }}>
                      {isSearchingAddress ? (
                        <p className="px-4 py-3 text-xs" style={{ color: "var(--guander-muted)" }}>Buscando...</p>
                      ) : (
                        addressSuggestions.map((s, idx) => (
                          <button key={idx} type="button" onClick={() => selectAddress(s)} className="w-full text-left px-4 py-3 text-xs hover:bg-gray-50 transition" style={{ color: "var(--guander-ink)" }}>
                            {s.displayName}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Location + Stars */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium" style={{ color: "var(--guander-ink)" }}>Ubicación</label>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="text-xs font-semibold px-3 py-1 rounded-lg border hover:bg-white transition"
                      style={{ borderColor: "var(--guander-border)", color: "var(--guander-forest)" }}
                    >
                      Elegir en mapa
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => { setFormLocation(e.target.value); if (formErrors.location) setFormErrors((p) => ({ ...p, location: "" })); }}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ border: `1px solid ${formErrors.location ? "#ef4444" : "var(--guander-border)"}`, color: "var(--guander-ink)" }}
                    placeholder="Lat,Lng"
                  />
                  {formErrors.location && <p className="text-xs mt-1 text-red-500">{formErrors.location}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--guander-ink)" }}>Valoración (0–5)</label>
                  <div className="flex items-center gap-1.5 mb-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setFormStars(String(star))} className="focus:outline-none transition-transform hover:scale-110">
                        <Star size={18} fill={parseFloat(formStars || "0") >= star ? "#f59e0b" : "none"} stroke={parseFloat(formStars || "0") >= star ? "#f59e0b" : "#aaa"} />
                      </button>
                    ))}
                    <button type="button" onClick={() => setFormStars("")} className="text-xs ml-1 px-1.5 py-0.5 rounded hover:bg-gray-100" style={{ color: "var(--guander-muted)" }}>✕</button>
                  </div>
                  <input
                    type="number" step="0.1" min="0" max="5"
                    value={formStars}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const n = parseFloat(raw);
                      setFormStars(raw === "" ? "" : !isNaN(n) ? String(Math.min(5, Math.max(0, parseFloat(n.toFixed(1))))) : raw);
                      if (formErrors.stars) setFormErrors((p) => ({ ...p, stars: "" }));
                    }}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
                    style={{ border: `1px solid ${formErrors.stars ? "#ef4444" : "var(--guander-border)"}`, color: "var(--guander-ink)" }}
                    placeholder="0 – 5"
                  />
                  {formErrors.stars && <p className="text-xs mt-1 text-red-500">{formErrors.stars}</p>}
                </div>
              </div>

              {/* Service type + Accepts points */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--guander-ink)" }}>Tipo de servicio</label>
                  <select
                    value={formServiceTypeId}
                    onChange={(e) => setFormServiceTypeId(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer"
                    style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}
                  >
                    {serviceTypes.length === 0 && <option value={editProfessional.serviceTypeId}>{editProfessional.serviceType}</option>}
                    {serviceTypes.map((t) => (
                      <option key={t.id_type_service} value={t.id_type_service}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--guander-ink)" }}>Acepta puntos</label>
                  <button
                    type="button"
                    onClick={() => setFormAcceptsPoints((v) => !v)}
                    className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                    style={
                      formAcceptsPoints
                        ? { backgroundColor: "#d6ede0", color: "#1f4b3b", border: "1px solid #7dcca8" }
                        : { backgroundColor: "var(--guander-cream)", color: "var(--guander-muted)", border: "1px solid var(--guander-border)" }
                    }
                  >
                    {formAcceptsPoints ? <><CheckCircle size={15} /> Sí, acepta</> : <><XCircle size={15} /> No acepta</>}
                  </button>
                </div>
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--guander-ink)" }}>Horarios</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Días de semana", value: formWeek, setter: setFormWeek },
                    { label: "Fin de semana", value: formWeekend, setter: setFormWeekend },
                    { label: "Domingo", value: formSunday, setter: setFormSunday },
                  ].map(({ label, value, setter }) => (
                    <div key={label}>
                      <label className="block text-xs font-medium mb-1" style={{ color: "var(--guander-muted)" }}>{label}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ border: "1px solid var(--guander-border)", color: "var(--guander-ink)" }}
                        placeholder="09:00–18:00"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs mt-1.5" style={{ color: "var(--guander-muted)" }}>Ej: 09:00–18:00 · Escribe &quot;Cerrado&quot; si no abre ese día.</p>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setEditProfessional(null)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
                style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleSaveEdit()}
                disabled={saving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--guander-forest)" }}
              >
                {saving ? "Guardando..." : "Guardar Cambios"}
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* ── View modal ── */}
      <Modal open={!!viewProfessional && !editProfessional} onClose={() => setViewProfessional(null)}>
        {viewProfessional && (
          <>
            <div className="p-5 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase size={18} style={{ color: "var(--guander-forest)" }} />
                <h2 className="text-lg font-bold" style={{ color: "var(--guander-ink)" }}>{viewProfessional.name}</h2>
              </div>
              <button onClick={() => setViewProfessional(null)} className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 pb-5 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ backgroundColor: "#d6ede0", color: "#1f4b3b" }}>{viewProfessional.serviceType}</span>
                {viewProfessional.acceptsPoints && (
                  <span className="text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1" style={{ backgroundColor: "#d6ede0", color: "#1f4b3b" }}>
                    <CheckCircle size={11} /> Acepta puntos
                  </span>
                )}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--guander-muted)" }}>Email</p>
                <p className="text-sm" style={{ color: "var(--guander-ink)" }}>{viewProfessional.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--guander-muted)" }}>Valoración</p>
                <StarRating value={viewProfessional.stars} />
              </div>
              {viewProfessional.address && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--guander-muted)" }}>Dirección</p>
                  <p className="text-sm" style={{ color: "var(--guander-ink)" }}>{viewProfessional.address}</p>
                </div>
              )}
              {viewProfessional.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--guander-muted)" }}>Descripción</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--guander-ink)" }}>{viewProfessional.description}</p>
                </div>
              )}
              {(viewProfessional.scheduleWeek || viewProfessional.scheduleWeekend || viewProfessional.scheduleSunday) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--guander-muted)" }}>Horarios</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Semana", value: viewProfessional.scheduleWeek },
                      { label: "Fin de semana", value: viewProfessional.scheduleWeekend },
                      { label: "Domingo", value: viewProfessional.scheduleSunday },
                    ].map(({ label, value }) => value ? (
                      <div key={label} className="rounded-xl p-2.5 text-center" style={{ backgroundColor: "var(--guander-cream)", border: "1px solid var(--guander-border)" }}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--guander-muted)" }}>{label}</p>
                        <p className="text-xs font-bold" style={{ color: "var(--guander-ink)" }}>{value}</p>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
              <button
                onClick={() => { openEdit(viewProfessional); setViewProfessional(null); }}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90"
                style={{ backgroundColor: "var(--guander-forest)" }}
              >
                Editar profesional
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}


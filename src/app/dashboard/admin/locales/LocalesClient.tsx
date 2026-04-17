"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import L from "leaflet";
import {
  Search,
  Star,
  ImageIcon,
  Plus,
  X,
  MapPin,
  Building2,
} from "lucide-react";

/* ─── Types ─── */
export interface LocaleItem {
  id: number;
  name: string;
  email: string;
  category: string;
  categoryId: number | null;
  rating: number | null;
  favorites: number;
  type: "Premium" | "Profesional" | "Free";
  description: string;
  address: string;
  location: string;
  image: string;
}

interface GeocodeSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

interface ReverseGeocodeResponse {
  address?: string;
}

interface Category {
  id_category: number;
  name: string;
  description: string;
}

const pickerMarkerIcon = L.icon({
  iconUrl: "/Marcador.png",
  iconSize: [52, 52],
  iconAnchor: [26, 32],
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

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  Premium: { bg: "#7d8b6a", text: "#ffffff" },
  Profesional: { bg: "#3d6b6b", text: "#ffffff" },
  Free: { bg: "#999999", text: "#ffffff" },
};

// Default categories will be loaded from API
const DEFAULT_CATEGORIES: Category[] = [
  {
    id_category: 1,
    name: "Veterinaria",
    description: "Servicios veterinarios para mascotas",
  },
  {
    id_category: 2,
    name: "Pet Shop",
    description: "Tienda de productos para mascotas",
  },
  { id_category: 3, name: "Cafetería", description: "Cafés pet-friendly" },
  {
    id_category: 4,
    name: "Restaurante",
    description: "Restaurantes pet-friendly",
  },
  {
    id_category: 5,
    name: "Grooming",
    description: "Peluquería y spa para mascotas",
  },
  {
    id_category: 6,
    name: "Resort",
    description: "Hospedaje y alojamiento para mascotas",
  },
];

const PLACEHOLDER_IMAGES = [
  "https://placehold.co/400x200/1f4b3b/ffffff?text=Local+1",
  "https://placehold.co/400x200/3d6b4f/ffffff?text=Local+2",
  "https://placehold.co/400x200/7d8b6a/ffffff?text=Local+3",
  "https://placehold.co/400x200/3d6b6b/ffffff?text=Local+4",
  "https://placehold.co/400x200/173a2d/ffffff?text=Local+5",
  "https://placehold.co/400x200/5a7a5a/ffffff?text=Local+6",
];

/* ─── Modal ─── */
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

  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [resolvingAddress, setResolvingAddress] = useState(false);

  useEffect(() => {
    if (!open || !mapContainerRef.current) return;

    const initial = parseLatLng(initialLocation) ?? {
      lat: -34.603722,
      lng: -58.381592,
    };
    setSelectedLocation(initial);

    let cancelled = false;

    const reverseGeocode = async (lat: number, lng: number) => {
      setResolvingAddress(true);
      try {
        const res = await fetch(
          `/api/admin/locales/reverse-geocode?lat=${lat}&lng=${lng}`,
        );
        if (!res.ok) {
          setSelectedAddress("");
          return;
        }
        const data = (await res.json()) as ReverseGeocodeResponse;
        setSelectedAddress(data.address ?? "");
      } catch {
        setSelectedAddress("");
      } finally {
        if (!cancelled) setResolvingAddress(false);
      }
    };

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    map.setView([initial.lat, initial.lng], 15);
    const marker = L.marker([initial.lat, initial.lng], {
      draggable: true,
      icon: pickerMarkerIcon,
    }).addTo(map);
    markerRef.current = marker;

    void reverseGeocode(initial.lat, initial.lng);

    const updateLocation = (lat: number, lng: number) => {
      marker.setLatLng([lat, lng]);
      setSelectedLocation({ lat, lng });
      void reverseGeocode(lat, lng);
    };

    map.on("click", (event: L.LeafletMouseEvent) => {
      updateLocation(event.latlng.lat, event.latlng.lng);
    });

    marker.on("dragend", () => {
      const position = marker.getLatLng();
      updateLocation(position.lat, position.lng);
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
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--guander-ink)" }}
        >
          Elegir ubicación en mapa
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
        >
          <X size={16} />
        </button>
      </div>
      <div className="px-6 pb-4 space-y-3">
        <p className="text-sm" style={{ color: "var(--guander-muted)" }}>
          Haz click en el punto exacto del local o arrastra el pin para ajustar
          la ubicación.
        </p>
        <div
          ref={mapContainerRef}
          className="w-full rounded-xl overflow-hidden"
          style={{
            border: "1px solid var(--guander-border)",
            minHeight: "380px",
          }}
        />
        <div
          className="rounded-xl p-3"
          style={{
            border: "1px solid var(--guander-border)",
            backgroundColor: "var(--guander-cream)",
          }}
        >
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: "var(--guander-muted)" }}
          >
            Ubicación seleccionada
          </p>
          <p className="text-sm" style={{ color: "var(--guander-ink)" }}>
            {selectedLocation
              ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
              : "Selecciona un punto en el mapa"}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--guander-muted)" }}>
            {resolvingAddress
              ? "Buscando dirección..."
              : selectedAddress ||
                "No se pudo resolver una dirección exacta para este punto."}
          </p>
        </div>
      </div>
      <div className="p-6 pt-2 flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
          style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            if (!selectedLocation) return;
            const location = `${selectedLocation.lat.toFixed(6)},${selectedLocation.lng.toFixed(6)}`;
            onConfirm({ location, address: selectedAddress });
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

const CLOUD_NAME = "dwckkyqpw";
const UPLOAD_PRESET = "guander_unsigned";

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", UPLOAD_PRESET);
  fd.append("folder", "guander/locales");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: fd,
    },
  );
  const data = (await res.json()) as {
    secure_url?: string;
    error?: { message: string };
  };
  if (!res.ok || !data.secure_url)
    throw new Error(data.error?.message ?? "Upload failed");
  return data.secure_url;
}

/* ─── Main ─── */
export default function LocalesClient({
  initialLocales,
}: {
  initialLocales: LocaleItem[];
}) {
  const searchParams = useSearchParams();
  const [locales, setLocales] = useState<LocaleItem[]>(initialLocales);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todas las categorías");
  const [viewLocale, setViewLocale] = useState<LocaleItem | null>(null);
  const [editLocale, setEditLocale] = useState<LocaleItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormName, setCategoryFormName] = useState("");
  const [categoryFormDescription, setCategoryFormDescription] = useState("");

  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCategory, setFormCategory] = useState(1);
  const [formStars, setFormStars] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formUserEmail, setFormUserEmail] = useState("");
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<
    GeocodeSuggestion[]
  >([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch("/api/admin/locales/categories");
        const data = (await res.json()) as { data: Category[] };
        if (data.data && data.data.length > 0) {
          setCategories(data.data);
        }
      } catch {
        // Keep default categories on error
      }
    };
    void loadCategories();
  }, []);

  useEffect(() => {
    const query = formAddress.trim();
    if (query.length < 4) {
      setAddressSuggestions([]);
      setIsSearchingAddress(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const res = await fetch(
          `/api/admin/locales/geocode?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) {
          setAddressSuggestions([]);
          return;
        }
        const data = (await res.json()) as {
          suggestions?: GeocodeSuggestion[];
        };
        setAddressSuggestions(data.suggestions ?? []);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [formAddress]);

  useEffect(() => {
    if (searchParams.get("add") === "true") {
      openAdd();
    }
  }, [searchParams]);

  // Helper functions for categories
  const getCategoryNameById = (id: number): string => {
    return (
      categories.find((c) => c.id_category === id)?.name ?? "Sin categoría"
    );
  };

  const getCategoryNames = (): string[] => {
    return ["Todas las categorías", ...categories.map((c) => c.name)];
  };

  const openEdit = (locale: LocaleItem) => {
    setFormName(locale.name);
    setFormDescription(locale.description);
    setFormAddress(locale.address);
    setFormCategory(locale.categoryId ?? 1);
    setFormStars(locale.rating?.toString() ?? "");
    setFormLocation(locale.location ?? "");
    setFormUserEmail("");
    setFormImageFile(null);
    setFormImagePreview(locale.image || "");
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setEditLocale(locale);
  };

  const openAdd = () => {
    setFormName("");
    setFormDescription("");
    setFormAddress("");
    setFormCategory(1);
    setFormStars("");
    setFormLocation("");
    setFormUserEmail("");
    setFormImageFile(null);
    setFormImagePreview("");
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setShowAdd(true);
  };

  // Category management functions
  const handleSaveCategory = async () => {
    if (!categoryFormName.trim()) {
      alert("El nombre de la categoría es requerido");
      return;
    }
    try {
      if (editingCategory) {
        const res = await fetch("/api/admin/locales/categories", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCategory.id_category,
            name: categoryFormName.trim(),
            description: categoryFormDescription.trim(),
          }),
        });
        const data = (await res.json()) as { error?: string; data?: Category };
        if (!res.ok) {
          alert(data.error || "Error al actualizar categoría");
          return;
        }
        setCategories((prev) =>
          prev.map((c) =>
            c.id_category === editingCategory.id_category
              ? {
                  ...c,
                  name: categoryFormName.trim(),
                  description: categoryFormDescription.trim(),
                }
              : c,
          ),
        );
        alert("Categoría actualizada exitosamente");
      } else {
        const res = await fetch("/api/admin/locales/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: categoryFormName.trim(),
            description: categoryFormDescription.trim(),
          }),
        });
        const data = (await res.json()) as { error?: string; data?: Category };
        if (!res.ok) {
          alert(data.error || "Error al crear categoría");
          return;
        }
        if (!data.data) {
          alert("No se recibió la categoría creada");
          return;
        }
        setCategories((prev) =>
          [...prev, data.data as Category].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
        alert("Categoría creada exitosamente");
      }
      setCategoryFormName("");
      setCategoryFormDescription("");
      setEditingCategory(null);
    } catch (error) {
      console.error("Error en handleSaveCategory:", error);
      alert("Error al guardar categoría");
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    if (!confirm("¿Estás seguro de eliminar esta categoría?")) return;
    try {
      const res = await fetch(
        `/api/admin/locales/categories?id=${categoryId}`,
        {
          method: "DELETE",
        },
      );
      const data = (await res.json()) as { error?: string; success?: boolean };
      if (!res.ok) {
        alert(data.error || "Error al eliminar categoría");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id_category !== categoryId));
      alert("Categoría eliminada exitosamente");
    } catch (error) {
      console.error("Error en handleDeleteCategory:", error);
      alert("Error al eliminar categoría");
    }
  };

  const openEditCategory = (cat: Category) => {
    setCategoryFormName(cat.name);
    setCategoryFormDescription(cat.description);
    setEditingCategory(cat);
  };

  const openAddCategory = () => {
    setCategoryFormName("");
    setCategoryFormDescription("");
    setEditingCategory(null);
  };

  const selectAddress = (suggestion: GeocodeSuggestion) => {
    setFormAddress(suggestion.displayName);
    setFormLocation(
      `${suggestion.lat.toFixed(6)},${suggestion.lng.toFixed(6)}`,
    );
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const handleSaveEdit = async () => {
    if (!editLocale || !formName.trim()) return;
    setSaving(true);
    try {
      let imageUrl = editLocale.image;
      if (formImageFile) {
        try {
          imageUrl = await uploadToCloudinary(formImageFile);
        } catch (e) {
          alert(`Error subiendo imagen: ${String(e)}`);
          setSaving(false);
          return;
        }
      }
      await fetch("/api/admin/locales", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_store: editLocale.id,
          name: formName,
          description: formDescription,
          address: formAddress,
          location: formLocation || null,
          stars: formStars ? parseFloat(formStars) : null,
          fk_category: formCategory,
          image_url: imageUrl,
        }),
      });
      setLocales((prev) =>
        prev.map((l) =>
          l.id === editLocale.id
            ? {
                ...l,
                name: formName,
                description: formDescription,
                address: formAddress,
                location: formLocation,
                rating: formStars ? parseFloat(formStars) : null,
                category: getCategoryNameById(formCategory),
                categoryId: formCategory,
                image: imageUrl,
              }
            : l,
        ),
      );
      setEditLocale(null);
    } catch {
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      let imageUrl = "";
      if (formImageFile) {
        try {
          imageUrl = await uploadToCloudinary(formImageFile);
        } catch (e) {
          alert(`Error subiendo imagen: ${String(e)}`);
          setSaving(false);
          return;
        }
      }
      const res = await fetch("/api/admin/locales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          address: formAddress,
          location: formLocation || null,
          fk_category: formCategory,
          stars: formStars ? parseFloat(formStars) : 0,
          user_email: formUserEmail || null,
          image_url: imageUrl || null,
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        id_store?: number;
        error?: string;
      };
      if (!res.ok || data.error) {
        alert(data.error ?? "Error al crear local");
        setSaving(false);
        return;
      }
      const newLocale: LocaleItem = {
        id: data.id_store ?? Date.now(),
        name: formName,
        email:
          formUserEmail ||
          `${
            formName
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 20) || "nuevo"
          }@gmail.com`,
        category: getCategoryNameById(formCategory),
        categoryId: formCategory,
        rating: formStars ? parseFloat(formStars) : null,
        favorites: 0,
        type: "Free",
        description: formDescription,
        address: formAddress,
        location: formLocation,
        image:
          imageUrl ||
          PLACEHOLDER_IMAGES[locales.length % PLACEHOLDER_IMAGES.length],
      };
      setLocales((prev) => [newLocale, ...prev]);
      setShowAdd(false);
    } catch {
      alert("Error al crear local");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este local?")) return;
    try {
      await fetch(`/api/admin/locales?id=${id}`, { method: "DELETE" });
      setLocales((prev) => prev.filter((l) => l.id !== id));
    } catch {
      alert("Error al eliminar");
    }
  };

  const filtered = locales.filter((locale) => {
    const matchSearch =
      search.trim() === "" ||
      locale.name.toLowerCase().includes(search.toLowerCase()) ||
      locale.email.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      category === "Todas las categorías" || locale.category === category;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  const renderForm = () => (
    <div className="space-y-4 p-6 pt-0">
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--guander-ink)" }}
        >
          Nombre *
        </label>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{
            border: "1px solid var(--guander-border)",
            color: "var(--guander-ink)",
          }}
          placeholder="Nombre del local"
        />
      </div>
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--guander-ink)" }}
        >
          Descripción
        </label>
        <textarea
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
          style={{
            border: "1px solid var(--guander-border)",
            color: "var(--guander-ink)",
          }}
          placeholder="Descripción del local"
        />
      </div>
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--guander-ink)" }}
        >
          Dirección
        </label>
        <div className="relative">
          <input
            type="text"
            value={formAddress}
            onChange={(e) => {
              setFormAddress(e.target.value);
              setShowAddressSuggestions(true);
            }}
            onFocus={() => setShowAddressSuggestions(true)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
            placeholder="Busca y selecciona la dirección exacta"
          />
          {showAddressSuggestions &&
            (addressSuggestions.length > 0 || isSearchingAddress) && (
              <div
                className="absolute z-20 mt-2 w-full rounded-xl border bg-white overflow-hidden"
                style={{
                  borderColor: "var(--guander-border)",
                  boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
                }}
              >
                {isSearchingAddress ? (
                  <p
                    className="px-4 py-3 text-xs"
                    style={{ color: "var(--guander-muted)" }}
                  >
                    Buscando direcciones...
                  </p>
                ) : (
                  addressSuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                      type="button"
                      onClick={() => selectAddress(suggestion)}
                      className="w-full text-left px-4 py-3 text-xs hover:bg-gray-50 transition"
                      style={{ color: "var(--guander-ink)" }}
                    >
                      {suggestion.displayName}
                    </button>
                  ))
                )}
              </div>
            )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--guander-ink)" }}
          >
            Categoría
          </label>
          <select
            value={formCategory}
            onChange={(e) => setFormCategory(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
          >
            {categories.map((cat) => (
              <option key={cat.id_category} value={cat.id_category}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--guander-ink)" }}
          >
            Valoración
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            value={formStars}
            onChange={(e) => setFormStars(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
            placeholder="4.5"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className="block text-sm font-medium"
              style={{ color: "var(--guander-ink)" }}
            >
              Ubicación
            </label>
            <button
              type="button"
              onClick={() => setShowMapPicker(true)}
              className="text-xs font-semibold px-3 py-1 rounded-lg border hover:bg-white transition"
              style={{
                borderColor: "var(--guander-border)",
                color: "var(--guander-forest)",
              }}
            >
              Elegir en mapa
            </button>
          </div>
          <input
            type="text"
            value={formLocation}
            onChange={(e) => setFormLocation(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
            placeholder="Lat,Lng del punto exacto"
          />
        </div>
        <div>
          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--guander-ink)" }}
          >
            Email del propietario
          </label>
          <input
            type="email"
            value={formUserEmail}
            onChange={(e) => setFormUserEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
            placeholder="usuario@email.com"
          />
        </div>
      </div>
      <div>
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--guander-ink)" }}
        >
          Imagen
        </label>
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setFormImageFile(file);
            if (file) setFormImagePreview(URL.createObjectURL(file));
            else setFormImagePreview("");
          }}
        />
        <div
          onClick={() => imageInputRef.current?.click()}
          className="rounded-xl overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-80 transition relative"
          style={{
            border: "2px dashed var(--guander-border)",
            background: "var(--guander-cream)",
            height: "120px",
          }}
        >
          {formImagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={formImagePreview}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center">
              <ImageIcon
                size={32}
                style={{ color: "var(--guander-muted)" }}
                className="mx-auto mb-1"
              />
              <p className="text-xs" style={{ color: "var(--guander-muted)" }}>
                Click para subir imagen
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--guander-muted)" }}
              >
                JPG, PNG, WEBP · máx 10MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--guander-ink)" }}
        >
          Gestión de Locales
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              openAddCategory();
              setShowCategoriesModal(true);
            }}
            className="px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1 hover:bg-gray-50 transition"
            style={{
              borderColor: "var(--guander-border)",
              color: "var(--guander-forest)",
            }}
            title="Gestionar categorías"
          >
            <Plus size={14} /> Categorías
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
        <div className="flex-1 relative min-w-0">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2"
            style={{ color: "var(--guander-muted)" }}
          />
          <input
            type="text"
            placeholder="Buscar local..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition bg-white"
            style={{
              border: "1px solid var(--guander-border)",
              color: "var(--guander-ink)",
            }}
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="px-4 py-3 rounded-xl text-sm outline-none bg-white cursor-pointer"
          style={{
            border: "1px solid var(--guander-border)",
            color: "var(--guander-ink)",
            minWidth: "160px",
          }}
        >
          {getCategoryNames().map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <button
          onClick={openAdd}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 cursor-pointer transition hover:opacity-90"
          style={{ backgroundColor: "var(--guander-forest)" }}
        >
          <Plus size={16} /> Agregar Local
        </button>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="bg-white rounded-2xl p-12 text-center"
          style={{ border: "1px solid var(--guander-border)" }}
        >
          <p className="text-sm" style={{ color: "var(--guander-muted)" }}>
            No se encontraron locales.
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {paginatedItems.map((locale) => {
              const typeStyle = TYPE_COLORS[locale.type] || TYPE_COLORS.Free;
              return (
                <div
                  key={locale.id}
                  className="bg-white rounded-2xl overflow-hidden"
                  style={{ border: "1px solid var(--guander-border)" }}
                >
                  {/* Image */}
                  <div
                    className="relative h-36 overflow-hidden"
                    style={{ backgroundColor: "var(--guander-cream)" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={locale.image}
                      alt={locale.name}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase"
                      style={{
                        backgroundColor: typeStyle.bg,
                        color: typeStyle.text,
                      }}
                    >
                      {locale.type}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="mb-1">
                      <h3
                        className="text-base font-bold"
                        style={{ color: "var(--guander-ink)" }}
                      >
                        {locale.name}
                      </h3>
                      <p
                        className="text-xs"
                        style={{ color: "var(--guander-muted)" }}
                      >
                        {locale.email}
                      </p>
                    </div>
                    <p
                      className="text-sm mb-2"
                      style={{ color: "var(--guander-muted)" }}
                    >
                      {locale.category}
                    </p>
                    <div className="flex items-center gap-6 mb-4">
                      <div className="flex items-center gap-1">
                        <span
                          className="text-sm"
                          style={{ color: "var(--guander-muted)" }}
                        >
                          Valoración :
                        </span>
                        {locale.rating != null && (
                          <>
                            <Star size={14} fill="#e3b75e" color="#e3b75e" />
                            <span
                              className="text-sm font-bold"
                              style={{ color: "var(--guander-ink)" }}
                            >
                              {locale.rating.toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="text-sm"
                          style={{ color: "var(--guander-muted)" }}
                        >
                          Favoritos :
                        </span>
                        <span
                          className="text-sm font-bold"
                          style={{ color: "var(--guander-ink)" }}
                        >
                          {locale.favorites}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setViewLocale(locale)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => openEdit(locale)}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90"
                        style={{ backgroundColor: "var(--guander-forest)" }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div
              className="flex items-center justify-between mt-6 px-4 py-4 bg-white rounded-2xl"
              style={{ border: "1px solid var(--guander-border)" }}
            >
              <p className="text-sm" style={{ color: "var(--guander-muted)" }}>
                Página {currentPage} de {totalPages} ({filtered.length} locales)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "var(--guander-mint)",
                    color: "var(--guander-forest)",
                  }}
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--guander-forest)" }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── View Modal ─── */}
      <Modal open={!!viewLocale} onClose={() => setViewLocale(null)}>
        {viewLocale && (
          <>
            <div
              className="relative h-48 overflow-hidden rounded-t-2xl"
              style={{ backgroundColor: "var(--guander-cream)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewLocale.image}
                alt={viewLocale.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setViewLocale(null)}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center cursor-pointer hover:bg-white transition"
              >
                <X size={16} />
              </button>
              <span
                className="absolute bottom-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded tracking-wide uppercase"
                style={{
                  backgroundColor: TYPE_COLORS[viewLocale.type]?.bg,
                  color: "#fff",
                }}
              >
                {viewLocale.type}
              </span>
            </div>
            <div className="p-6">
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: "var(--guander-ink)" }}
              >
                {viewLocale.name}
              </h2>
              <p
                className="text-xs mb-4"
                style={{ color: "var(--guander-muted)" }}
              >
                {viewLocale.email}
              </p>
              {viewLocale.description && (
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--guander-ink)" }}
                >
                  {viewLocale.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div
                  className="rounded-xl p-3"
                  style={{ backgroundColor: "var(--guander-cream)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Building2
                      size={14}
                      style={{ color: "var(--guander-forest)" }}
                    />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--guander-muted)" }}
                    >
                      Categoría
                    </span>
                  </div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--guander-ink)" }}
                  >
                    {viewLocale.category}
                  </p>
                </div>
                <div
                  className="rounded-xl p-3"
                  style={{ backgroundColor: "var(--guander-cream)" }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={14} fill="#e3b75e" color="#e3b75e" />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: "var(--guander-muted)" }}
                    >
                      Valoración
                    </span>
                  </div>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "var(--guander-ink)" }}
                  >
                    {viewLocale.rating != null
                      ? viewLocale.rating.toFixed(1)
                      : "Sin valorar"}
                  </p>
                </div>
              </div>
              {viewLocale.address && (
                <div className="flex items-start gap-2 mb-4">
                  <MapPin
                    size={16}
                    className="shrink-0 mt-0.5"
                    style={{ color: "var(--guander-forest)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "var(--guander-ink)" }}
                  >
                    {viewLocale.address}
                  </p>
                </div>
              )}
              <div
                className="flex items-center gap-4 text-sm mb-6"
                style={{ color: "var(--guander-muted)" }}
              >
                <span>❤️ {viewLocale.favorites} favoritos</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setViewLocale(null);
                    openEdit(viewLocale);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: "var(--guander-forest)" }}
                >
                  Editar Local
                </button>
                <button
                  onClick={() => {
                    handleDelete(viewLocale.id);
                    setViewLocale(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90 bg-red-50 text-red-600 border border-red-200"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>

      {/* ─── Edit Modal ─── */}
      <Modal open={!!editLocale} onClose={() => setEditLocale(null)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--guander-ink)" }}
          >
            Editar Local
          </h2>
          <button
            onClick={() => setEditLocale(null)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>
        {renderForm()}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={() => setEditLocale(null)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
            style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveEdit}
            disabled={saving || !formName.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--guander-forest)" }}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </Modal>

      {/* ─── Add Modal ─── */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--guander-ink)" }}
          >
            Agregar Nuevo Local
          </h2>
          <button
            onClick={() => setShowAdd(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>
        {renderForm()}
        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={() => setShowAdd(false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
            style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleAdd}
            disabled={saving || !formName.trim()}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--guander-forest)" }}
          >
            {saving ? "Creando..." : "Crear Local"}
          </button>
        </div>
      </Modal>

      <MapLocationPicker
        open={showMapPicker}
        initialLocation={formLocation}
        onClose={() => setShowMapPicker(false)}
        onConfirm={({ location, address }) => {
          setFormLocation(location);
          if (address) {
            setFormAddress(address);
          }
          setShowAddressSuggestions(false);
          setShowMapPicker(false);
        }}
      />

      {/* ─── Categories Modal ─── */}
      <Modal
        open={showCategoriesModal}
        onClose={() => setShowCategoriesModal(false)}
        maxWidthClass="max-w-2xl"
      >
        <div className="p-6 pb-3 flex items-center justify-between">
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--guander-ink)" }}
          >
            Gestionar Categorías
          </h2>
          <button
            onClick={() => setShowCategoriesModal(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Form para agregar/editar */}
          <div
            className="space-y-3 pb-4 border-b"
            style={{ borderColor: "var(--guander-border)" }}
          >
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--guander-ink)" }}
              >
                Nombre {editingCategory ? "" : "*"} (editar)
              </label>
              <input
                type="text"
                value={categoryFormName}
                onChange={(e) => setCategoryFormName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  border: "1px solid var(--guander-border)",
                  color: "var(--guander-ink)",
                }}
                placeholder={
                  editingCategory
                    ? "Nombre de la categoría"
                    : "Nueva categoría..."
                }
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "var(--guander-ink)" }}
              >
                Descripción
              </label>
              <textarea
                value={categoryFormDescription}
                onChange={(e) => setCategoryFormDescription(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{
                  border: "1px solid var(--guander-border)",
                  color: "var(--guander-ink)",
                }}
                placeholder="Descripción de la categoría..."
              />
            </div>
            <div className="flex gap-2">
              {editingCategory && (
                <button
                  onClick={() => {
                    setCategoryFormName("");
                    setCategoryFormDescription("");
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
                >
                  Cancelar edición
                </button>
              )}
              <button
                onClick={handleSaveCategory}
                disabled={!categoryFormName.trim()}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition cursor-pointer hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--guander-forest)" }}
              >
                {editingCategory ? "Actualizar" : "Crear Categoría"}
              </button>
            </div>
          </div>

          {/* Lista de categorías */}
          <div className="space-y-2">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--guander-ink)" }}
            >
              Categorías existentes:
            </p>
            {categories.length === 0 ? (
              <p className="text-xs" style={{ color: "var(--guander-muted)" }}>
                No hay categorías
              </p>
            ) : (
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.id_category}
                    className="p-3 rounded-lg flex items-start justify-between"
                    style={{ backgroundColor: "var(--guander-cream)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--guander-ink)" }}
                      >
                        {cat.name}
                      </p>
                      {cat.description && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: "var(--guander-muted)" }}
                        >
                          {cat.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer hover:opacity-90"
                        style={{
                          backgroundColor: "var(--guander-forest)",
                          color: "#fff",
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id_category)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer hover:opacity-90 bg-red-50 text-red-600 border border-red-200"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-2 flex gap-3">
          <button
            onClick={() => setShowCategoriesModal(false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer hover:opacity-90"
            style={{ backgroundColor: "#c5cdb3", color: "#3d4f35" }}
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </div>
  );
}

"use client";

import { useState } from "react";
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const CATEGORY_GRADIENTS: Record<string, { from: string; to: string }> = {
  "Veterinaria":   { from: "#3D52D5", to: "#4A9FD4" },
  "Pet Shop":      { from: "#1d7a4f", to: "#43D696" },
  "Cafetería":     { from: "#b45309", to: "#f59e0b" },
  "Restaurante":   { from: "#be185d", to: "#f472b6" },
  "Grooming":      { from: "#7c3aed", to: "#a78bfa" },
  "Resort":        { from: "#0f766e", to: "#34d399" },
};

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
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export default function LocationsFilterClient({ locations }: LocationsFilterClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);

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

  const hasActiveFilters = activeCategory !== "Todos" || searchTerm.trim().length > 0;

  return (
    <>
      {/* Filter panel */}
      <Card variant="outlined" sx={{ mb: 3, border: '1px solid', borderColor: 'rgba(61,82,213,0.12)' }}>
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
              gap: 1,
              mb: 2.5,
            }}
          >
            <Typography variant="subtitle1" sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}>
              Explora locales
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filteredLocations.length} resultados · Filtro: {activeCategory}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 1.5, mb: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre, ciudad o descripción"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              disabled={!hasActiveFilters}
              onClick={() => { setActiveCategory("Todos"); setSearchTerm(""); }}
              sx={{ whiteSpace: 'nowrap', px: 3, py: 1 }}
            >
              Limpiar filtros
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {categories.map((cat) => (
              <Chip
                key={cat}
                label={`${cat} (${categoryCount[cat] ?? 0})`}
                onClick={() => setActiveCategory(cat)}
                color={activeCategory === cat ? 'primary' : 'default'}
                variant={activeCategory === cat ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2.5,
        }}
      >
        {filteredLocations.map((location) => {
          const grad = CATEGORY_GRADIENTS[location.category] ?? { from: "#3D52D5", to: "#6B7FD4" };
          return (
          <Card
            key={location.id}
            variant="outlined"
            sx={{
              border: '1px solid',
              borderColor: 'rgba(61,82,213,0.1)',
              overflow: 'hidden',
              transition: 'transform 0.25s, box-shadow 0.25s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 28px rgba(61,82,213,0.12)',
              },
            }}
          >
            {/* Placeholder image */}
            <Box
              sx={{
                height: 140,
                background: `linear-gradient(135deg, ${grad.from} 0%, ${grad.to} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <PhotoCameraIcon sx={{ fontSize: 40, color: 'rgba(255,255,255,0.35)' }} />
              <Chip
                label={location.category}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  bgcolor: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              />
            </Box>

            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.3, mb: 1 }}>
                {location.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                {location.description}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
                  {location.city}
                </Typography>
              </Box>
            </CardContent>
          </Card>
          );
        })}
      </Box>

      {filteredLocations.length === 0 && (
        <Box
          sx={{
            mt: 3,
            p: 5,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'rgba(61,82,213,0.15)',
            borderRadius: 3,
          }}
        >
          <Typography color="text.secondary">
            No encontramos locales con esos filtros. Probá otra categoría o término de búsqueda.
          </Typography>
        </Box>
      )}
    </>
  );
}

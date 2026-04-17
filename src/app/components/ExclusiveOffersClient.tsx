"use client";

import { useMemo, useState } from "react";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Pagination from '@mui/material/Pagination';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';

const TAG_GRADIENTS: Record<string, string> = {
  Tienda: 'linear-gradient(135deg, #2e7d32 0%, #43a047 100%)',
  Profesional: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
};

export interface OfferCardItem {
  id: number;
  title: string;
  subtitle: string;
  tag: "Profesional" | "Tienda";
  entityName?: string;
  entityCategory?: string;
  entityAddress?: string;
}

interface ExclusiveOffersClientProps {
  offers: OfferCardItem[];
}

const FILTERS = ["Todas", "Profesional", "Tienda"] as const;
type OfferFilter = (typeof FILTERS)[number];
const PAGE_SIZE = 9;

export default function ExclusiveOffersClient({ offers }: ExclusiveOffersClientProps) {
  const [activeFilter, setActiveFilter] = useState<OfferFilter>("Todas");
  const [page, setPage] = useState(1);

  const filteredOffers = useMemo(() => {
    if (activeFilter === "Todas") return offers;
    return offers.filter((o) => o.tag === activeFilter);
  }, [activeFilter, offers]);

  const totalPages = Math.ceil(filteredOffers.length / PAGE_SIZE);
  const pageOffers = useMemo(
    () => filteredOffers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredOffers, page]
  );

  function handleFilter(f: OfferFilter) {
    setActiveFilter(f);
    setPage(1);
  }

  const counter = useMemo(() => ({
    Todas: offers.length,
    Profesional: offers.filter((o) => o.tag === "Profesional").length,
    Tienda: offers.filter((o) => o.tag === "Tienda").length,
  }), [offers]);

  return (
    <>
      {/* Filter bar */}
      <Card
        variant="outlined"
        sx={{ mb: 3, border: '1px solid', borderColor: 'rgba(61,82,213,0.12)' }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3 }, '&:last-child': { pb: { xs: 2.5, sm: 3 } } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'center' },
              justifyContent: 'space-between',
              gap: 1,
              mb: 2,
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ color: 'primary.main', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.75rem' }}
            >
              Filtrar beneficios
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {filteredOffers.length} ofertas activas
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {FILTERS.map((filter) => (
              <Chip
                key={filter}
                label={`${filter} (${counter[filter]})`}
                onClick={() => handleFilter(filter)}
                color={activeFilter === filter ? 'primary' : 'default'}
                variant={activeFilter === filter ? 'filled' : 'outlined'}
                size="small"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Cards grid */}
      {filteredOffers.length > 0 ? (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 2.5,
            }}
          >
            {pageOffers.map((offer) => (
            <Card
              key={offer.id}
              variant="outlined"
              sx={{
                border: '1px solid',
                borderColor: 'rgba(61,82,213,0.1)',
                bgcolor: 'background.paper',
                overflow: 'hidden',
                transition: 'transform 0.25s, box-shadow 0.25s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 28px rgba(61,82,213,0.12)',
                },
              }}
            >
              {/* Image placeholder */}
              <Box
                sx={{
                  height: 130,
                  background: TAG_GRADIENTS[offer.tag] ?? 'linear-gradient(135deg, #607d8b 0%, #90a4ae 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {offer.tag === 'Profesional' ? (
                  <WorkspacePremiumIcon sx={{ fontSize: 52, color: 'rgba(255,255,255,0.35)' }} />
                ) : (
                  <LocalOfferIcon sx={{ fontSize: 52, color: 'rgba(255,255,255,0.35)' }} />
                )}
                {/* Tag chip over the image */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    left: 12,
                    bgcolor: 'rgba(0,0,0,0.45)',
                    backdropFilter: 'blur(6px)',
                    color: '#fff',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 99,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {offer.tag}
                </Box>
              </Box>

              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.75, lineHeight: 1.4 }}>
                  {offer.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 1.5 }}>
                  {offer.subtitle}
                </Typography>

                {/* Entity info */}
                {(offer.entityName || offer.entityCategory || offer.entityAddress) && (
                  <>
                    <Divider sx={{ mb: 1.5 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                      {offer.entityName && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          {offer.tag === 'Tienda'
                            ? <StorefrontIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                            : <PersonIcon sx={{ fontSize: 14, color: 'text.disabled' }} />}
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                            {offer.entityName}
                          </Typography>
                        </Box>
                      )}
                      {offer.entityCategory && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <CategoryOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                            {offer.entityCategory}
                          </Typography>
                        </Box>
                      )}
                      {offer.entityAddress && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                          <RoomOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled', mt: '1px' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                            {offer.entityAddress}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      ) : (
        <Box
          sx={{
            p: 5,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'rgba(61,82,213,0.15)',
            borderRadius: 3,
          }}
        >
          <Typography color="text.secondary">
            No hay beneficios para este filtro en este momento.
          </Typography>
        </Box>
      )}
    </>
  );
}

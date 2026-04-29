"use client";

import { useEffect, useMemo, useState } from "react";
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PersonIcon from '@mui/icons-material/Person';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';

export interface OfferCardItem {
  id: number;
  title: string;
  subtitle: string;
  tag: "Profesional" | "Tienda";
  entityName?: string;
  entityCategory?: string;
  entityAddress?: string;
  entityImage?: string;
}

interface ExclusiveOffersClientProps {
  offers: OfferCardItem[];
}

const PAGE_SIZE = 6;
const INTERVAL_MS = 4000;

export default function ExclusiveOffersClient({ offers }: ExclusiveOffersClientProps) {
  const withImage = useMemo(() => offers.filter((o) => !!o.entityImage), [offers]);
  const totalPages = Math.ceil(withImage.length / PAGE_SIZE);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(() => {
      setPage((prev) => (prev + 1) % totalPages);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [totalPages]);

  const pageOffers = useMemo(
    () => withImage.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [withImage, page],
  );

  if (withImage.length === 0) {
    return (
      <Box sx={{ p: 5, textAlign: 'center', border: '2px dashed', borderColor: 'rgba(79,129,103,0.26)', borderRadius: 3 }}>
        <Typography color="text.secondary">No hay beneficios disponibles en este momento.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2.5,
        }}
      >
        {pageOffers.map((offer, i) => (
          <Card
            key={`${offer.tag}-${offer.id}-${i}`}
            variant="outlined"
            sx={{
              border: '1px solid',
              borderColor: 'rgba(79,129,103,0.2)',
              bgcolor: 'background.paper',
              overflow: 'hidden',
              transition: 'transform 0.25s, box-shadow 0.25s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(79,129,103,0.16)',
              },
            }}
          >
            {/* Image */}
            <Box sx={{ height: 160, position: 'relative', overflow: 'hidden' }}>
              <Box
                component="img"
                src={offer.entityImage}
                alt={offer.entityName ?? offer.title}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
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

      {/* Dot indicators */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 3 }}>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <Box
              key={idx}
              sx={{
                width: idx === page ? 20 : 8,
                height: 8,
                borderRadius: 99,
                bgcolor: idx === page ? '#15803d' : 'rgba(21,128,61,0.25)',
                transition: 'all 0.3s',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}



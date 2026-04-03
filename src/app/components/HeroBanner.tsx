import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Navbar from "./Navbar";

const features = [
  { icon: "🏪", label: "Locales pet-friendly" },
  { icon: "🎟️", label: "Cupones y descuentos" },
  { icon: "⭐", label: "Reseñas verificadas" },
  { icon: "🏆", label: "Sistema de puntos" },
];

export default function HeroBanner() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #1e2a8a 0%, #2d5fa6 45%, #1a7a6e 100%)',
      }}
    >
      {/* ── Aurora shader layer ── */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        {/* Blob 1 — teal/mint top-left */}
        <Box
          className="aurora-blob-1"
          sx={{
            position: 'absolute',
            top: '-30%',
            left: '-15%',
            width: '70%',
            height: '130%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(67,214,150,0.38) 0%, transparent 68%)',
            filter: 'blur(48px)',
          }}
        />
        {/* Blob 2 — blue right */}
        <Box
          className="aurora-blob-2"
          sx={{
            position: 'absolute',
            top: '5%',
            right: '-20%',
            width: '65%',
            height: '110%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(74,159,212,0.42) 0%, transparent 68%)',
            filter: 'blur(56px)',
          }}
        />
        {/* Blob 3 — indigo bottom-center */}
        <Box
          className="aurora-blob-3"
          sx={{
            position: 'absolute',
            bottom: '-40%',
            left: '25%',
            width: '55%',
            height: '90%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(99,62,220,0.36) 0%, transparent 68%)',
            filter: 'blur(64px)',
          }}
        />
        {/* Blob 4 — green highlight center */}
        <Box
          className="aurora-blob-4"
          sx={{
            position: 'absolute',
            top: '30%',
            left: '40%',
            width: '40%',
            height: '60%',
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at center, rgba(67,216,176,0.22) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
        {/* Subtle noise grain overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: 0.04,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: '200px 200px',
          }}
        />
      </Box>

      <Navbar />

      <Container
        maxWidth="xl"
        sx={{ pb: { xs: 10, sm: 14 }, pt: { xs: 2, sm: 3 }, px: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'center', lg: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 8, lg: 6 },
          }}
        >
          {/* Left: copy */}
          <Box sx={{ maxWidth: { xs: '100%', lg: 580 }, textAlign: { xs: 'center', lg: 'left' } }}>
            {/* Badge */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 0.75,
                borderRadius: '999px',
                bgcolor: 'rgba(67,214,150,0.15)',
                border: '1px solid rgba(67,214,150,0.35)',
                mb: 3,
              }}
            >
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#43D696' }} />
              <Typography sx={{ color: '#43D696', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                PLATAFORMA PET-FRIENDLY
              </Typography>
            </Box>

            <Typography
              variant="h1"
              sx={{
                color: 'white',
                fontSize: { xs: '2.1rem', sm: '2.75rem', md: '3.4rem', lg: '4rem' },
                lineHeight: 1.15,
                mb: 3,
                fontWeight: 900,
                letterSpacing: '-0.02em',
              }}
            >
              Encuentra los mejores{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(90deg, #43D696 0%, #67e8d0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                lugares petfriendly
              </Box>
              {' '}cerca de ti
            </Typography>

            <Typography
              sx={{
                color: 'rgba(255,255,255,0.72)',
                mb: 5,
                maxWidth: { xs: '100%', sm: 460 },
                mx: { xs: 'auto', lg: 0 },
                lineHeight: 1.8,
                fontSize: { xs: '1rem', md: '1.0625rem' },
              }}
            >
              Tiendas, veterinarias, cafés y restaurantes que aman a las mascotas tanto como tú.
              Acumula puntos, canjea cupones y dale lo mejor a tu peludo.
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              sx={{ justifyContent: { xs: 'center', lg: 'flex-start' }, mb: 6 }}
            >
              <Button
                component="a"
                href="#tiendas"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: '#43D696',
                  color: '#0f2b1f',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  px: 3.5,
                  boxShadow: '0 0 24px rgba(67,214,150,0.45)',
                  '&:hover': { bgcolor: '#38c484', boxShadow: '0 0 32px rgba(67,214,150,0.6)' },
                }}
              >
                Explorar Tiendas
              </Button>
              <Button
                component="a"
                href="#planes"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  fontSize: '0.8rem',
                  px: 3.5,
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                Ver Planes
              </Button>
            </Stack>

            {/* Feature pills */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: { xs: 'center', lg: 'flex-start' } }}>
              {features.map(({ icon, label }) => (
                <Box
                  key={label}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.75,
                    py: 0.75,
                    borderRadius: '999px',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <Typography sx={{ fontSize: '0.95rem', lineHeight: 1 }}>{icon}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.78rem', fontWeight: 600 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Right: glass card */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              flexShrink: 0,
              width: 300,
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Main stat card */}
            <Box
              sx={{
                borderRadius: '1.5rem',
                background: 'rgba(255,255,255,0.12)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.2)',
                p: 3,
              }}
            >
              <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', mb: 1.5 }}>
                PLATAFORMA ACTIVA
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box>
                  <Typography sx={{ color: 'white', fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>
                    500+
                  </Typography>
                  <Typography sx={{ color: '#43D696', fontSize: '0.82rem', fontWeight: 600, mt: 0.5 }}>
                    Locales registrados
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '1rem',
                    bgcolor: 'rgba(67,214,150,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.75rem',
                  }}
                >
                  🐾
                </Box>
              </Box>
              {/* Mini bar */}
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.12)', borderRadius: '999px', height: 4, overflow: 'hidden' }}>
                <Box sx={{ width: '72%', height: '100%', borderRadius: '999px', bgcolor: '#43D696' }} />
              </Box>
            </Box>

            {/* Two small cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { emoji: '🎟️', value: '2K+', label: 'Cupones activos' },
                { emoji: '⭐', value: '4.8', label: 'Rating promedio' },
              ].map(({ emoji, value, label }) => (
                <Box
                  key={label}
                  sx={{
                    borderRadius: '1.25rem',
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{emoji}</Typography>
                  <Typography sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 900, lineHeight: 1 }}>
                    {value}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 600, mt: 0.5 }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

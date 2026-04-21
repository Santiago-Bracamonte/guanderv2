import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Navbar from "./Navbar";

export default function HeroBanner() {
  return (
    <Box
      component="section"
      sx={{ position: 'relative', overflow: 'hidden', minHeight: { xs: '100svh', md: '92vh' }, display: 'flex', flexDirection: 'column' }}
    >
      {/* Background video */}
      <Box
        component="video"
        autoPlay
        muted
        loop
        playsInline
        src="/v1.mp4"
        sx={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          zIndex: 0,
        }}
      />
      {/* Overlay to keep text readable */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(28, 63, 48, 0.58)',
          zIndex: 1,
        }}
      />
      <Box sx={{ position: 'relative', zIndex: 2 }}>
        <Navbar />
      </Box>

      <Container
        maxWidth="xl"
        sx={{ pb: { xs: 8, sm: 12 }, pt: { xs: 2, sm: 3 }, px: { xs: 3, sm: 4 }, position: 'relative', zIndex: 2 }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'center', lg: 'center' },
            justifyContent: 'space-between',
            gap: { xs: 6, lg: 4 },
          }}
        >
          {/* Left: copy */}
          <Box sx={{ maxWidth: { xs: '100%', lg: 560 }, textAlign: { xs: 'center', lg: 'left' } }}>
           
            <Typography
              variant="h1"
              sx={{
                color: 'white',
                fontSize: { xs: '2.1rem', sm: '2.6rem', md: '3.3rem', lg: '3.8rem' },
                mb: 3,
              }}
            >
              Encuentra los mejores lugares{' '}
              <Box component="span" sx={{ color: '#b9e7d0' }}>
                pet-friendly cerca de ti
              </Box>
            </Typography>

            <Typography
              sx={{
                color: 'rgba(255,255,255,0.75)',
                mb: 4,
                maxWidth: { xs: '100%', sm: 420 },
                mx: { xs: 'auto', lg: 0 },
                lineHeight: 1.75,
                fontSize: { xs: '0.9375rem', md: '1rem' },
              }}
            >
              Tiendas, veterinarias, cafés, restaurantes y profesionales que aman
              a las mascotas tanto como tú. Acumula puntos, canjea cupones y dale
              lo mejor a tu peludo.
            </Typography>

            <Stack
              direction="row"
              spacing={2}
              flexWrap="wrap"
              sx={{ justifyContent: { xs: 'center', lg: 'flex-start' } }}
            >
              <Button
                component="a"
                href="#tiendas"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: '#ecf6f0',
                  color: '#1f4b3b',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  '&:hover': { bgcolor: '#dff0e6' },
                }}
              >
                Explorar locales
              </Button>
              <Button
                component="a"
                href="#planes"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'rgba(236,246,240,0.85)',
                  color: 'white',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  '&:hover': {
                    borderColor: '#ecf6f0',
                    bgcolor: 'rgba(236,246,240,0.2)',
                  },
                }}
              >
                Ver Planes
              </Button>
            </Stack>
          </Box>

          {/* Right: glass card */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              flexShrink: 0,
              width: 260,
              height: 260,
              borderRadius: '2rem',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(214,240,225,0.24)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(232,248,239,0.45)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            }}
          >
            <Box
              component="img"
              src="/LogoGuander.png"
              alt="Logo Guander"
              sx={{ width: 160, height: 160, objectFit: 'cover', borderRadius: '1.5rem', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

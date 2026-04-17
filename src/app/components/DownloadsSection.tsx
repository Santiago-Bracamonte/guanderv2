import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';

export default function DownloadsSection() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        bgcolor: '#0f2f24',
        overflow: 'hidden',
        py: { xs: 8, md: 12 },
        width: '100%',
      }}
    >
      {/* Decorative blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '50%',
          height: '70%',
          borderRadius: '50%',
          bgcolor: 'rgba(67,214,150,0.06)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '50%',
          height: '70%',
          borderRadius: '50%',
          bgcolor: 'rgba(134,239,172,0.12)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: { xs: 3, sm: 4 } }}>
        <Typography
          variant="h2"
          sx={{
            color: 'white',
            fontSize: { xs: '2rem', md: '2.75rem', lg: '3.25rem' },
            mb: 3,
            textWrap: 'balance',
          }}
        >
          Conecta tu mascota con lugares{' '}
          <Box component="span" sx={{ color: '#43D696' }}>pet-friendly</Box>
        </Typography>

        <Typography
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: { xs: '1rem', md: '1.125rem' },
            maxWidth: 560,
            mx: 'auto',
            lineHeight: 1.75,
            mb: 6,
          }}
        >
          Descubre locales, restaurantes y servicios que aman a las mascotas tanto como tú.
          Gana puntos por cada visita y canjéalos por recompensas.
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<PhoneAndroidIcon />}
          sx={{
            bgcolor: 'white',
            color: '#123a2f',
            fontWeight: 800,
            fontSize: '1rem',
            px: 4,
            py: 1.75,
            boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.95)',
              boxShadow: '0 12px 40px rgba(255,255,255,0.15)',
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.25s',
          }}
        >
          Descargar para Android
        </Button>
      </Container>
    </Box>
  );
}

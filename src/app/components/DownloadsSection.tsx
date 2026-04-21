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
        bgcolor: '#ecf6f0',
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
          bgcolor: 'rgba(132,191,159,0.1)',
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
          bgcolor: 'rgba(160,214,186,0.16)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center', px: { xs: 3, sm: 4 } }}>
        <Typography
          variant="h2"
          sx={{
            color: '#1f4b3b',
            fontSize: { xs: '2rem', md: '2.75rem', lg: '3.25rem' },
            mb: 3,
            textWrap: 'balance',
          }}
        >
          Conecta tu mascota con lugares{' '}
          <Box component="span" sx={{ color: '#6ea88a' }}>pet-friendly</Box>
        </Typography>

        <Typography
          sx={{
            color: '#486556',
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
            bgcolor: '#79b795',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '1rem',
            px: 4,
            py: 1.75,
            boxShadow: '0 8px 24px rgba(31,75,59,0.18)',
            '&:hover': {
              bgcolor: '#6ca886',
              boxShadow: '0 10px 28px rgba(31,75,59,0.22)',
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

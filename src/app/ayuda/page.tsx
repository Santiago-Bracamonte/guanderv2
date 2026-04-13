import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';

export const metadata = {
  title: 'Centro de ayuda | Guander',
};

const topics = [
  {
    icon: <SearchIcon sx={{ fontSize: 28, color: '#43D696' }} />,
    title: 'Buscar locales y servicios',
    description:
      'Explorá el mapa interactivo para encontrar locales pet-friendly cerca de vos. Podés filtrar por categoría, distancia o nombre del negocio.',
    link: { label: 'Ir al inicio', href: '/' },
  },
  {
    icon: <StorefrontIcon sx={{ fontSize: 28, color: '#43D696' }} />,
    title: 'Registrar mi local',
    description:
      'Si sos dueño de un local o profesional de servicios para mascotas, podés sumarte a Guander de forma rápida y sencilla.',
    link: { label: 'Ver cómo adherirse', href: '/como-adherirse' },
  },
  {
    icon: <LocalOfferIcon sx={{ fontSize: 28, color: '#43D696' }} />,
    title: 'Beneficios y cupones',
    description:
      'Los usuarios de Guander acceden a descuentos exclusivos en locales afiliados. Los cupones se muestran en la sección de Ofertas de la página principal.',
    link: null,
  },
  {
    icon: <ChatBubbleOutlineIcon sx={{ fontSize: 28, color: '#43D696' }} />,
    title: 'Sistema de mensajería',
    description:
      'Los usuarios pueden enviar mensajes directamente a los locales desde su perfil. Los locales responden desde su panel de administración.',
    link: null,
  },
  {
    icon: <LockOutlinedIcon sx={{ fontSize: 28, color: '#43D696' }} />,
    title: 'Seguridad de cuenta',
    description:
      'Si tenés problemas para acceder, podés restablecer tu contraseña desde la pantalla de inicio de sesión. Para problemas de seguridad graves, contáctanos.',
    link: { label: 'Ir al login', href: '/login' },
  },
  {
    icon: <LayersOutlinedIcon sx={{ fontSize: 28, color: '#43D696' }} />,
    title: 'Planes y suscripciones',
    description:
      'Los locales cuentan con distintos planes de visibilidad. Podés ver los detalles y decidir qué plan se adapta mejor a tu negocio.',
    link: { label: 'Ver planes', href: '/#planes' },
  },
];

export default function AyudaPage() {
  return (
    <Box sx={{ bgcolor: '#0f1035', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mb: 1 }}>
          Centro de ayuda
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.55)', mb: 6 }}>
          Encontrá guías y recursos para sacarle el máximo provecho a Guander.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 8,
          }}
        >
          {topics.map((topic) => (
            <Box
              key={topic.title}
              sx={{
                p: 3.5,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                transition: 'border-color 0.2s',
                '&:hover': { borderColor: 'rgba(67,214,150,0.3)' },
              }}
            >
              <Box>{topic.icon}</Box>
              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                {topic.title}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, flex: 1 }}>
                {topic.description}
              </Typography>
              {topic.link && (
                <MuiLink
                  href={topic.link.href}
                  underline="hover"
                  sx={{ color: '#43D696', fontSize: '0.85rem', fontWeight: 600, mt: 0.5, '&:hover': { color: 'white' } }}
                >
                  {topic.link.label} →
                </MuiLink>
              )}
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 6 }} />

        {/* FAQ shortcut */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
              ¿Tenés más preguntas?
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Revisá nuestras preguntas frecuentes o escribinos directamente.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <MuiLink
              href="/faq"
              underline="none"
              sx={{
                px: 3, py: 1.25, bgcolor: 'rgba(255,255,255,0.07)', borderRadius: 2,
                color: 'white', fontSize: '0.875rem', fontWeight: 600,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' }, transition: 'background 0.2s',
              }}
            >
              Ver FAQ
            </MuiLink>
            <MuiLink
              href="/#contacto"
              underline="none"
              sx={{
                px: 3, py: 1.25, bgcolor: '#43D696', borderRadius: 2,
                color: '#0f1035', fontSize: '0.875rem', fontWeight: 700,
                '&:hover': { bgcolor: '#2fc47e' }, transition: 'background 0.2s',
              }}
            >
              Contactarnos
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

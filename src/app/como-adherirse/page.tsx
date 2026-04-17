import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import RoomOutlinedIcon from '@mui/icons-material/RoomOutlined';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import StarOutlineIcon from '@mui/icons-material/StarOutline';

export const metadata = {
  title: 'Cómo adherirse | Guander',
};

const steps = [
  {
    number: '01',
    title: 'Creá tu cuenta',
    description:
      'Registrate en Guander seleccionando el rol "Profesional / Local". Completá tu nombre, correo y una contraseña segura. El proceso es rápido y gratuito.',
  },
  {
    number: '02',
    title: 'Configurá tu perfil',
    description:
      'Ingresá al panel de tu local y completá toda la información: nombre del negocio, dirección, horarios, categoría, descripción y fotos. Mientras más completo esté tu perfil, más visible serás.',
  },
  {
    number: '03',
    title: 'Elegí tu plan',
    description:
      'Seleccioná el plan de suscripción que mejor se adapte a tu negocio. Contamos con opciones para emprendedores individuales y para negocios con mayor volumen de clientes.',
  },
  {
    number: '04',
    title: 'Publicá servicios y beneficios',
    description:
      'Agregá tus servicios, promociones y cupones exclusivos para los usuarios de Guander. Los beneficios aumentan la atracción de nuevos clientes y la fidelización.',
  },
  {
    number: '05',
    title: 'Conectá con tus clientes',
    description:
      'Usá el sistema de mensajería integrado para responder consultas, confirmar turnos y mantener el contacto directo con los dueños de mascotas de tu zona.',
  },
];

const benefits = [
  { icon: <RoomOutlinedIcon sx={{ fontSize: 20, color: '#43D696' }} />, text: 'Aparecé en el mapa de locales pet-friendly de tu ciudad' },
  { icon: <LocalOfferIcon sx={{ fontSize: 20, color: '#43D696' }} />, text: 'Publicá cupones y promociones exclusivas para usuarios Guander' },
  { icon: <ChatBubbleOutlineIcon sx={{ fontSize: 20, color: '#43D696' }} />, text: 'Comunicación directa con clientes potenciales' },
  { icon: <BarChartOutlinedIcon sx={{ fontSize: 20, color: '#43D696' }} />, text: 'Estadísticas de visitas a tu perfil' },
  { icon: <StarOutlineIcon sx={{ fontSize: 20, color: '#43D696' }} />, text: 'Mayor visibilidad frente a miles de dueños de mascotas' },
];

export default function ComoAdherirse() {
  return (
    <Box sx={{ bgcolor: '#0f1035', minHeight: '100vh' }}>
      {/* Hero */}
      <Box sx={{ bgcolor: '#1a1b3c', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mb: 2 }}>
            Sumá tu local a Guander
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.6)', mb: 4, lineHeight: 1.8 }}>
            Conectá con miles de dueños de mascotas que buscan exactamente lo que ofrecés.
            El proceso de registro es simple, rápido y gratuito.
          </Typography>
          <Button
            href="/register"
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#43D696',
              color: '#0f1035',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: 2,
              '&:hover': { bgcolor: '#2fc47e' },
              textDecoration: 'none',
            }}
          >
            Registrar mi local
          </Button>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: { xs: 8, md: 10 } }}>
        {/* Steps */}
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 5 }}>
          Cómo funciona
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mb: 10 }}>
          {steps.map((step) => (
            <Box
              key={step.number}
              sx={{
                display: 'flex',
                gap: 3,
                p: 3,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 3,
              }}
            >
              <Typography
                sx={{ color: '#43D696', fontWeight: 900, fontSize: '2rem', lineHeight: 1, minWidth: 48 }}
              >
                {step.number}
              </Typography>
              <Box>
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 0.75 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
                  {step.description}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 8 }} />

        {/* Benefits */}
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 4 }}>
          Beneficios de estar en Guander
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mb: 8 }}>
          {benefits.map((b) => (
            <Box key={b.text} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>{b.icon}</Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.95rem' }}>{b.text}</Typography>
            </Box>
          ))}
        </Box>

        {/* CTA */}
        <Box
          sx={{
            textAlign: 'center',
            p: { xs: 4, md: 6 },
            bgcolor: 'rgba(67,214,150,0.08)',
            border: '1px solid rgba(67,214,150,0.2)',
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 1.5 }}>
            ¿Listo para empezar?
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mb: 3 }}>
            El registro es gratuito y podés tener tu perfil activo en minutos.
          </Typography>
          <Button
            href="/register"
            variant="contained"
            sx={{
              bgcolor: '#43D696',
              color: '#0f1035',
              fontWeight: 700,
              px: 4,
              borderRadius: 2,
              '&:hover': { bgcolor: '#2fc47e' },
            }}
          >
            Crear cuenta ahora
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

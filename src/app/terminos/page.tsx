import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const metadata = {
  title: 'Términos y condiciones | Guander',
};

const sections = [
  {
    title: '1. Aceptación de los términos',
    content:
      'Al acceder y utilizar la plataforma Guander, usted acepta quedar vinculado por estos Términos y condiciones. Si no está de acuerdo con alguna parte de los términos, no podrá acceder al servicio.',
  },
  {
    title: '2. Descripción del servicio',
    content:
      'Guander es una plataforma digital que conecta a dueños de mascotas con locales y profesionales pet-friendly. Facilitamos el descubrimiento de servicios, la acumulación de beneficios y la comunicación entre usuarios y proveedores.',
  },
  {
    title: '3. Registro de cuenta',
    content:
      'Para acceder a ciertas funcionalidades, deberá crear una cuenta proporcionando información veraz y actualizada. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades realizadas desde su cuenta.',
  },
  {
    title: '4. Uso aceptable',
    content:
      'Usted se compromete a usar la plataforma únicamente para fines lícitos. Está prohibido publicar contenido falso, engañoso, ofensivo o que infrinja derechos de terceros. Guander se reserva el derecho de suspender cuentas que violen estas condiciones.',
  },
  {
    title: '5. Contenido generado por usuarios',
    content:
      'Al subir imágenes, textos u otro contenido, usted otorga a Guander una licencia no exclusiva para usar, mostrar y distribuir dicho contenido dentro de la plataforma. Usted garantiza tener los derechos necesarios sobre el contenido que publica.',
  },
  {
    title: '6. Limitación de responsabilidad',
    content:
      'Guander actúa como intermediario y no se responsabiliza por la calidad de los servicios prestados por los locales o profesionales registrados. La plataforma se ofrece "tal cual" sin garantías de disponibilidad ininterrumpida.',
  },
  {
    title: '7. Modificaciones',
    content:
      'Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos de cambios significativos a través de la plataforma o por correo electrónico. El uso continuado del servicio tras las modificaciones implica su aceptación.',
  },
  {
    title: '8. Ley aplicable',
    content:
      'Estos términos se rigen por las leyes vigentes de la República Argentina. Para cualquier disputa, las partes se someten a la jurisdicción de los tribunales ordinarios.',
  },
];

export default function TerminosPage() {
  return (
    <Box sx={{ bgcolor: '#0f1035', minHeight: '100vh' }}>
      <Container maxWidth="md" sx={{ py: { xs: 8, md: 12 } }}>
        <Button
          href="/"
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#43D696',
            textTransform: 'none',
            fontWeight: 600,
            mb: 4,
            pl: 0,
            '&:hover': { color: 'white', background: 'transparent' },
          }}
        >
          Volver al inicio
        </Button>
        <Typography variant="h3" sx={{ color: 'white', fontWeight: 900, mb: 1 }}>
          Términos y condiciones
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 4 }}>
          Última actualización: abril 2026
        </Typography>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 6 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {sections.map((s) => (
            <Box key={s.title}>
              <Typography variant="h6" sx={{ color: '#43D696', fontWeight: 700, mb: 1.5 }}>
                {s.title}
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.72)', lineHeight: 1.9 }}>
                {s.content}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 6 }} />
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)' }}>
          ¿Tienes dudas?{' '}
          <MuiLink href="/#contacto" sx={{ color: '#43D696', '&:hover': { color: 'white' } }}>
            Contáctanos
          </MuiLink>
        </Typography>
      </Container>
    </Box>
  );
}

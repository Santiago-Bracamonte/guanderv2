import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const metadata = {
  title: 'Política de privacidad | Guander',
};

const sections = [
  {
    title: '1. Información que recopilamos',
    content:
      'Recopilamos información que usted nos proporciona directamente al registrarse: nombre, correo electrónico, teléfono y dirección. También recopilamos datos de uso de la plataforma, como páginas visitadas, búsquedas realizadas y ubicación aproximada cuando la habilita.',
  },
  {
    title: '2. Uso de la información',
    content:
      'Utilizamos su información para gestionar su cuenta, personalizar su experiencia, enviarle notificaciones sobre servicios y beneficios relevantes, y mejorar nuestra plataforma. No vendemos su información personal a terceros.',
  },
  {
    title: '3. Cookies y tecnologías similares',
    content:
      'Usamos cookies para mantener sesiones, recordar preferencias y analizar el tráfico. Puede configurar su navegador para rechazar cookies, aunque algunas funcionalidades pueden verse limitadas.',
  },
  {
    title: '4. Compartición de datos',
    content:
      'Podemos compartir información con proveedores de servicios que nos asisten en la operación de la plataforma (hosting, análisis, mensajería), siempre bajo acuerdos de confidencialidad. También divulgaremos información cuando sea requerido por ley.',
  },
  {
    title: '5. Seguridad',
    content:
      'Implementamos medidas técnicas y organizativas para proteger su información. Sin embargo, ningún sistema es 100% seguro. Le recomendamos usar contraseñas fuertes y únicas para su cuenta.',
  },
  {
    title: '6. Sus derechos',
    content:
      'Tiene derecho a acceder, rectificar o eliminar sus datos personales. Para ejercer estos derechos, contáctenos a través del formulario de contacto. Procesaremos su solicitud dentro de los plazos legales aplicables.',
  },
  {
    title: '7. Retención de datos',
    content:
      'Conservamos su información mientras su cuenta esté activa o según sea necesario para proveer los servicios. Puede solicitar la eliminación de su cuenta en cualquier momento.',
  },
  {
    title: '8. Cambios en esta política',
    content:
      'Podemos actualizar esta política periódicamente. Le notificaremos sobre cambios significativos y la fecha de la última actualización siempre estará visible al inicio de esta página.',
  },
];

export default function PrivacidadPage() {
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
          Política de privacidad
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
          ¿Tienes dudas sobre tus datos?{' '}
          <MuiLink href="/#contacto" sx={{ color: '#43D696', '&:hover': { color: 'white' } }}>
            Contáctanos
          </MuiLink>
        </Typography>
      </Container>
    </Box>
  );
}

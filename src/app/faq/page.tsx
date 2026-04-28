'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const faqs = [
  {
    category: 'General',
    items: [
      {
        q: '¿Qué es Guander?',
        a: 'Guander es una plataforma que conecta a dueños de mascotas con locales y profesionales pet-friendly. Podés descubrir tiendas, veterinarias, peluquerías caninas y más, acumular beneficios y comunicarte directamente con los proveedores.',
      },
      {
        q: '¿Es gratis para los usuarios?',
        a: 'Sí, registrarse y usar Guander como usuario es completamente gratuito. Los locales y profesionales cuentan con planes de suscripción para gestionar su presencia en la plataforma.',
      },
      {
        q: '¿Cómo descargo la app?',
        a: 'Guander está disponible como aplicación web desde cualquier navegador. Las apps móviles para iOS y Android se encuentran en desarrollo.',
      },
    ],
  },
  {
    category: 'Cuenta y registro',
    items: [
      {
        q: '¿Cómo me registro?',
        a: 'Hacé clic en "Registrarse" en la barra superior, completá el formulario con tus datos y listo. El proceso toma menos de un minuto.',
      },
      {
        q: '¿Olvidé mi contraseña, qué hago?',
        a: 'En la pantalla de inicio de sesión encontrarás la opción "¿Olvidaste tu contraseña?". Te enviaremos un correo con instrucciones para restablecerla.',
      },
      {
        q: '¿Puedo cambiar mi correo electrónico?',
        a: 'Sí, podés actualizar tu correo desde la sección de configuración de tu perfil.',
      },
    ],
  },
  {
    category: 'Para locales y profesionales',
    items: [
      {
        q: '¿Cómo registro mi local?',
        a: 'Creá una cuenta seleccionando el rol "Profesional / Local" durante el registro. Una vez dentro, podrás completar el perfil de tu negocio, agregar fotos, servicios y horarios.',
      },
      {
        q: '¿Qué planes de suscripción existen?',
        a: 'Ofrecemos planes mensuales con distintos niveles de visibilidad y funcionalidades. Podés ver los detalles en la sección de Planes de nuestra landing page.',
      },
      {
        q: '¿Puedo cancelar mi suscripción en cualquier momento?',
        a: 'Sí, podés cancelar tu suscripción desde el panel de administración de tu local sin penalidades.',
      },
    ],
  },
  {
    category: 'Beneficios y cupones',
    items: [
      {
        q: '¿Cómo funcionan los beneficios?',
        a: 'Los locales afiliados ofrecen descuentos y promociones exclusivas a los usuarios de Guander. Accedé a ellos desde la sección "Ofertas exclusivas" en la página principal.',
      },
      {
        q: '¿Los cupones tienen fecha de vencimiento?',
        a: 'Cada cupón tiene sus propias condiciones. La fecha de vigencia se muestra claramente al ver el detalle de la oferta.',
      },
    ],
  },
];

export default function FaqPage() {
  const [expanded, setExpanded] = useState<string | false>(false);

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

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
          Preguntas frecuentes
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.55)', mb: 6 }}>
          Encontrá respuestas a las dudas más comunes sobre Guander.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {faqs.map((section) => (
            <Box key={section.category}>
              <Typography
                variant="subtitle1"
                sx={{ color: '#43D696', fontWeight: 700, mb: 2, textTransform: 'uppercase', fontSize: '0.78rem', letterSpacing: '0.06em' }}
              >
                {section.category}
              </Typography>
              {section.items.map((item, i) => {
                const panelId = `${section.category}-${i}`;
                return (
                  <Accordion
                    key={panelId}
                    expanded={expanded === panelId}
                    onChange={handleChange(panelId)}
                    disableGutters
                    elevation={0}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '8px !important',
                      mb: 1.5,
                      '&:before': { display: 'none' },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon sx={{ color: '#43D696' }} />}
                      sx={{ px: 3, py: 1.5 }}
                    >
                      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                        {item.q}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ px: 3, pb: 2.5 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, fontSize: '0.9rem' }}>
                        {item.a}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 8, p: 4, bgcolor: 'rgba(67,214,150,0.08)', borderRadius: 3, border: '1px solid rgba(67,214,150,0.2)' }}>
          <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
            ¿No encontraste lo que buscabas?
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>
            Escribinos directamente desde nuestro{' '}
            <MuiLink href="/#contacto" sx={{ color: '#43D696', '&:hover': { color: 'white' } }}>
              formulario de contacto
            </MuiLink>{' '}
            y te responderemos a la brevedad.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}

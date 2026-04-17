import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import MuiLink from '@mui/material/Link';
import Divider from '@mui/material/Divider';

const legalLinks = [
  { label: "Términos y condiciones", href: "/terminos" },
  { label: "Política de privacidad", href: "/privacidad" },
  { label: "Preguntas Frecuentes", href: "/faq" },
  { label: "Contacto", href: "/#contacto" },
];

const professionalLinks = [
  { label: "Registrar mi local", href: "/register" },
  { label: "Cómo adherirse", href: "/como-adherirse" },
  { label: "Centro de ayuda", href: "/ayuda" },
];

const socialIcons = [
  {
    label: "Facebook",
    path: "M22 12c0-5.522-4.478-10-10-10S2 6.478 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
  },
  {
    label: "Instagram",
    path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    label: "Twitter",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    label: "YouTube",
    path: "M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z",
  },
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#1a1b3c', width: '100%' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 3, sm: 4 }, py: { xs: 8, md: 10 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 5,
            mb: 6,
          }}
        >
          {/* Brand */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography sx={{ color: '#43D696', fontSize: '1.25rem', fontWeight: 900 }}>✶</Typography>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 800 }}>Guander</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.8 }}>
              La plataforma que conecta dueños de mascotas con locales y servicios pet-friendly.
              Descubre, visita y acumula recompensas.
            </Typography>
          </Box>

          {/* Legal */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Legal
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {legalLinks.map((link) => (
                <Box component="li" key={link.label}>
                  <MuiLink
                    href={link.href}
                    underline="hover"
                    sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', '&:hover': { color: '#43D696' }, transition: 'color 0.2s' }}
                  >
                    {link.label}
                  </MuiLink>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Para Profesionales */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Para profesionales
            </Typography>
            <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              {professionalLinks.map((link) => (
                <Box component="li" key={link.label}>
                  <MuiLink
                    href={link.href}
                    underline="hover"
                    sx={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', '&:hover': { color: '#43D696' }, transition: 'color 0.2s' }}
                  >
                    {link.label}
                  </MuiLink>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Redes Sociales */}
          <Box>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 2, letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Redes sociales
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {socialIcons.map((social) => (
                <MuiLink
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  sx={{
                    color: 'rgba(255,255,255,0.55)',
                    display: 'flex',
                    '&:hover': { color: '#43D696' },
                    transition: 'color 0.2s',
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d={social.path} />
                  </svg>
                </MuiLink>
              ))}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 4 }} />

        <Typography variant="body2" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
          © 2026 Guander. Todos los derechos reservados.
        </Typography>
      </Container>
    </Box>
  );
}

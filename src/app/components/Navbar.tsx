"use client";

import Link from "next/link";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';

const navLinks = [
  { label: "Inicio", href: "/", active: true },
  { label: "Tiendas", href: "#tiendas" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar() {
  return (
    <Box component="nav" sx={{ width: '100%' }}>
      <Container
        maxWidth="xl"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2.5,
          px: { xs: 3, sm: 4 },
        }}
      >
        <Box
          component={Link}
          href="/"
          sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
        >
          <Typography sx={{ color: '#43D696', fontSize: '1.5rem', lineHeight: 1, fontWeight: 900 }}>
            ✶
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Guander
          </Typography>
        </Box>

        <Box component="ul" sx={{ display: 'flex', gap: 0.5, listStyle: 'none', m: 0, p: 0 }}>
          {navLinks.map((link) => (
            <Box component="li" key={link.label}>
              <Button
                component={Link}
                href={link.href}
                size="small"
                sx={{
                  color: link.active ? '#43D696' : 'rgba(255,255,255,0.85)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: '#43D696',
                    bgcolor: 'rgba(255,255,255,0.08)',
                  },
                }}
              >
                {link.label}
              </Button>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

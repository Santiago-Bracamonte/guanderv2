"use client";

import Link from "next/link";
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Collapse from "@mui/material/Collapse";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";

const navLinks = [
  { label: "Inicio", href: "/", active: true },
  { label: "Tiendas", href: "#tiendas" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box component="nav" sx={{ width: "100%" }}>
      {/* Main bar */}
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: { xs: 1.75, sm: 2.5 },
          px: { xs: 3, sm: 4 },
        }}
      >
        {/* Logo */}
        <Box
          component={Link}
          href="/"
          sx={{ display: "flex", alignItems: "center", gap: 1, textDecoration: "none" }}
        >
          <Box
            component="img"
            src="/Marcador.png"
            alt="Logo Guander"
            sx={{ width: 34, height: 34, objectFit: "contain", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))" }}
          />
          <Typography variant="h6" sx={{ color: "white", fontWeight: 800, letterSpacing: "-0.02em" }}>
            Guander
          </Typography>
        </Box>

        {/* Desktop links */}
        <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", gap: 2 }}>
          <Box component="ul" sx={{ display: "flex", gap: 0.5, listStyle: "none", m: 0, p: 0 }}>
            {navLinks.map((link) => (
              <Box component="li" key={link.label}>
                <Button
                  component={Link}
                  href={link.href}
                  size="small"
                  sx={{
                    color: link.active ? "#b9e7d0" : "rgba(255,255,255,0.85)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    "&:hover": { color: "#b9e7d0", bgcolor: "rgba(255,255,255,0.08)" },
                  }}
                >
                  {link.label}
                </Button>
              </Box>
            ))}
          </Box>
          <Button
            component={Link}
            href="/login"
            size="small"
            startIcon={<PersonIcon sx={{ fontSize: "1.2rem", transition: "transform 0.3s" }} />}
            sx={{
              color: "#b9e7d0",
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              px: 2.5,
              py: 1,
              "&:hover": { bgcolor: "rgba(185,231,208,0.14)", "& svg": { transform: "translateY(-3px) rotate(8deg)" } },
            }}
          >
            Iniciar sesión
          </Button>
        </Box>

        {/* Mobile: login icon + hamburger */}
        <Box sx={{ display: { xs: "flex", md: "none" }, alignItems: "center", gap: 0.5 }}>
          <IconButton
            component={Link}
            href="/login"
            aria-label="Iniciar sesión"
            sx={{ color: "#b9e7d0", p: 1 }}
          >
            <PersonIcon />
          </IconButton>
          <IconButton
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            sx={{ color: "white", p: 1 }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Box>
      </Container>

      {/* Mobile dropdown */}
      <Collapse in={mobileOpen}>
        <Box
          sx={{
            bgcolor: "rgba(10, 59, 43, 0.97)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            px: 3,
            pt: 1,
            pb: 3,
          }}
        >
          {navLinks.map((link) => (
            <Button
              key={link.label}
              component={Link}
              href={link.href}
              fullWidth
              onClick={() => setMobileOpen(false)}
              sx={{
                color: link.active ? "#b9e7d0" : "rgba(255,255,255,0.85)",
                fontWeight: 600,
                fontSize: "1rem",
                justifyContent: "flex-start",
                py: 1.25,
                "&:hover": { color: "#b9e7d0", bgcolor: "rgba(255,255,255,0.05)" },
              }}
            >
              {link.label}
            </Button>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

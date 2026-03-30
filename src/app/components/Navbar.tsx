"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import PetsIcon from "@mui/icons-material/Pets";
import PersonIcon from "@mui/icons-material/Person";

const navLinks = [
  { label: "Inicio", href: "/", active: true },
  { label: "Tiendas", href: "#tiendas" },
  { label: "Planes", href: "#planes" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar() {
  return (
    <Box component="nav" sx={{ width: "100%" }}>
      <Container
        maxWidth="xl"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 2.5,
          px: { xs: 3, sm: 4 },
        }}
      >
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
          }}
        >
          <Typography
            sx={{
              color: "#43D696",
              fontSize: "1.5rem",
              lineHeight: 1,
              fontWeight: 900,
            }}
          >
            ✶
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: "white", fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Guander
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            component="ul"
            sx={{ display: "flex", gap: 0.5, listStyle: "none", m: 0, p: 0 }}
          >
            {navLinks.map((link) => (
              <Box component="li" key={link.label}>
                <Button
                  component={Link}
                  href={link.href}
                  size="small"
                  sx={{
                    color: link.active ? "#43D696" : "rgba(255,255,255,0.85)",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    "&:hover": {
                      color: "#43D696",
                      bgcolor: "rgba(255,255,255,0.08)",
                    },
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
            startIcon={
              <PersonIcon
                sx={{
                  fontSize: "1.2rem",
                  transition:
                    "transform 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                }}
              />
            }
            sx={{
              bgcolor: "transparent",
              color: "#43D696",
              fontWeight: 600,
              fontSize: "0.875rem",
              textTransform: "none",
              px: 2.5,
              py: 1,
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
              "&::before": {
                content: '""',
                position: "absolute",
                top: "-50%",
                left: "-50%",
                width: "200%",
                height: "200%",
                background:
                  "radial-gradient(circle, rgba(67, 214, 150, 0.2) 0%, transparent 70%)",
                opacity: 0,
                transition: "opacity 0.5s ease",
              },
              "&:hover": {
                "&::before": {
                  opacity: 1,
                  animation: "pulse-ripple 0.6s ease-out",
                },
                "& svg": {
                  transform: "translateY(-4px) rotate(10deg)",
                },
              },
              "@keyframes pulse-ripple": {
                "0%": {
                  transform: "scale(0)",
                  opacity: 1,
                },
                "100%": {
                  transform: "scale(1)",
                  opacity: 0,
                },
              },
            }}
          >
            Iniciar sesión
          </Button>
        </Box>
      </Container>
    </Box>
  );
}

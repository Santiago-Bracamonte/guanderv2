"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { ThemeProvider, alpha, createTheme } from "@mui/material/styles";

interface User {
  id: number;
  email: string;
  name: string;
  lastName: string;
  role: string;
}

const drawerWidth = 284;

const professionalTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1f4675", contrastText: "#ffffff" },
    secondary: { main: "#2d629b" },
    background: {
      default: "#edf2fb",
      paper: "#ffffff",
    },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
});

const navItems = [
  { id: "resumen", label: "Dashboard", icon: <DashboardRoundedIcon /> },
  { id: "servicios", label: "Servicios", icon: <AssignmentRoundedIcon /> },
  { id: "plan", label: "Plan", icon: <WorkspacePremiumRoundedIcon /> },
] as const;

type ProfessionalSection = (typeof navItems)[number]["id"];

export default function ProfessionalDashboard() {
  const router = useRouter();
  const [user] = useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const userData = JSON.parse(userStr) as User;
      return userData.role === "professional" ? userData : null;
    } catch {
      return null;
    }
  });
  const [selectedSection, setSelectedSection] = useState<ProfessionalSection>("resumen");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [router, user]);

  if (!user) return null;

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/");
  }

  const sectionTitle =
    selectedSection === "resumen"
      ? "Vista general"
      : selectedSection === "servicios"
        ? "Servicios profesionales"
        : "Plan profesional";

  const drawerContent = (
    <Box sx={{ height: "100%", px: 1.2, py: 1, display: "flex", flexDirection: "column" }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          px: 1.5,
          py: 1.5,
          border: "1px solid #d4e0ef",
          bgcolor: "#f5f9ff",
        }}
      >
        <Typography variant="overline" sx={{ color: "#5b7390", letterSpacing: "0.12em" }}>
          GUANDER PRO
        </Typography>
        <Typography variant="body2" sx={{ color: "#15365f", fontWeight: 800 }}>
          Centro de control
        </Typography>
      </Paper>

      <List sx={{ mt: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = selectedSection === item.id;
          return (
            <ListItemButton
              key={item.id}
              onClick={() => {
                setSelectedSection(item.id);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: active ? alpha("#1f4675", 0.12) : "transparent",
                color: active ? "#15365f" : "#5b7390",
                border: active ? "1px solid #c9d7ea" : "1px solid transparent",
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 600 }} />
            </ListItemButton>
          );
        })}
      </List>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<LogoutRoundedIcon />}
        onClick={handleLogout}
        sx={{ color: "#1f4675", borderColor: "#1f4675" }}
      >
        Cerrar Sesión
      </Button>
    </Box>
  );

  return (
    <ThemeProvider theme={professionalTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#edf2fb" }}>
        <AppBar
          position="fixed"
          color="transparent"
          elevation={0}
          sx={{
            display: { md: "none" },
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #d4e0ef",
          }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography sx={{ ml: 1, fontWeight: 700, color: "#15365f" }}>Guander Profesional</Typography>
          </Toolbar>
        </AppBar>

        <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: "block", md: "none" },
              "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
            }}
          >
            {drawerContent}
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                borderRight: "1px solid #d4e0ef",
                bgcolor: "#ffffff",
              },
            }}
            open
          >
            {drawerContent}
          </Drawer>
        </Box>

        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, mt: { xs: 8, md: 0 } }}>
          <Paper
            elevation={0}
            sx={{
              border: "1px solid #d6e4da",
              p: { xs: 1.8, md: 2.2 },
              mb: 2,
              borderRadius: 3,
              background: "linear-gradient(180deg, #ffffff 0%, #f4f8ff 100%)",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="overline" sx={{ color: "#5b7390", letterSpacing: "0.12em" }}>
                  Dashboard Profesional
                </Typography>
                <Typography variant="h5" sx={{ color: "#15365f", mt: 0.4 }}>
                  {sectionTitle}
                </Typography>
              </Box>
              <Chip sx={{ bgcolor: "#dce8f8", color: "#15365f", alignSelf: "center" }} label={`${user.name} ${user.lastName}`} />
            </Stack>
          </Paper>

          <Card elevation={0} sx={{ border: "1px solid #d6e4da", background: "#ffffff" }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: "#15365f", fontWeight: 800 }}>
                Panel de Profesional
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Bienvenido, {user.name}. Aquí verás tus servicios, actividades y estado de plan en la misma estructura visual del dashboard local.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, color: "#5b7390" }}>
                Cuenta: {user.email}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

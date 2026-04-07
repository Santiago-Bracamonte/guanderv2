"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import MedicalServicesRoundedIcon from "@mui/icons-material/MedicalServicesRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import ReviewsRoundedIcon from "@mui/icons-material/ReviewsRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import { ThemeProvider, alpha, createTheme } from "@mui/material/styles";
import type { DashboardData } from "./types";
import {
  StoreCouponsCrudSection,
  StorePromotionsCrudSection,
  StoreServicesCrudSection,
} from "./StoreCrudSections";

type DashboardSection =
  | "dashboard"
  | "suscripcion"
  | "servicios"
  | "promociones"
  | "cupones"
  | "reseñas"
  | "notificaciones";

const drawerWidth = 284;

const guanderTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1f4b3b", contrastText: "#ffffff" },
    secondary: { main: "#2f6a54" },
    background: {
      default: "#edf4ef",
      paper: "#ffffff",
    },
    success: { main: "#2e7d5b" },
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    h4: { fontWeight: 800 },
    h5: { fontWeight: 800 },
    h6: { fontWeight: 700 },
    body2: { color: "#4b675b" },
  },
});

const navItems: Array<{ id: DashboardSection; label: string; icon: React.ReactNode }> = [
  { id: "dashboard", label: "Dashboard", icon: <DashboardRoundedIcon /> },
  { id: "suscripcion", label: "Mi Suscripcion", icon: <WorkspacePremiumRoundedIcon /> },
  { id: "servicios", label: "Mis Servicios", icon: <MedicalServicesRoundedIcon /> },
  { id: "promociones", label: "Mis Promociones", icon: <CampaignRoundedIcon /> },
  { id: "cupones", label: "Cupones y Consumos", icon: <ConfirmationNumberRoundedIcon /> },
  { id: "reseñas", label: "Reseñas", icon: <ReviewsRoundedIcon /> },
  { id: "notificaciones", label: "Notificaciones", icon: <NotificationsActiveRoundedIcon /> },
];

function money(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);
}

function when(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}

function initials(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PanelCard({ title, subtitle, value }: { title: string; subtitle?: string; value: string }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #d6e4da",
        background: "linear-gradient(180deg, #ffffff 0%, #f7fbf8 100%)",
      }}
    >
      <CardContent>
        <Typography variant="caption" sx={{ color: "#5f7a6d", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {title}
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, color: "#173a2d", fontWeight: 900 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardOverview({ data }: { data: DashboardData }) {
  const avgStars = data.avgStoreRating > 0 ? data.avgStoreRating.toFixed(1) : data.store.stars.toFixed(1);

  return (
    <Stack spacing={2.2}>
      <Card
        elevation={0}
        sx={{
          border: "1px solid #ccddd0",
          background: "linear-gradient(125deg, #1f4b3b 0%, #2a6a53 65%, #1e5946 100%)",
          color: "#fff",
        }}
      >
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)", letterSpacing: "0.14em" }}>
                PANEL LOCAL GUANDER
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.4 }}>
                {data.store.name}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.8, color: "rgba(255,255,255,0.8)" }}>
                {data.store.address} · {data.store.location}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip label={data.store.category_name ?? "Sin categoria"} sx={{ bgcolor: "#deebdf", color: "#173a2d", fontWeight: 700 }} />
              <Chip icon={<StarRoundedIcon sx={{ color: "#e2c65a !important" }} />} label={`${avgStars} estrellas`} sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "#fff" }} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, minmax(0, 1fr))" } }}>
        <PanelCard title="Servicios activos" value={String(data.servicesCount)} />
        <PanelCard title="Cupones activos" value={String(data.activeCouponsCount)} />
        <PanelCard title="Ventas del mes" value={money(data.monthlySalesAmount)} subtitle={`${data.monthlySalesCount} compras`} />
        <PanelCard title="Reseñas" value={String(data.totalReviews)} subtitle={`Promedio ${avgStars} estrellas`} />
      </Box>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", xl: "1.4fr 1fr" } }}>
        <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: "#173a2d" }}>
              Actividad reciente
            </Typography>
            <Stack spacing={1.2} sx={{ mt: 2 }}>
              {data.purchases.length === 0 && <Typography variant="body2">Aun no hay compras registradas.</Typography>}
              {data.purchases.map((purchase) => (
                <Paper key={purchase.id_store_purchase} variant="outlined" sx={{ borderColor: "#e0ece4", p: 1.3, borderRadius: 2, bgcolor: "#f8fcf9" }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                    <Box>
                      <Typography fontWeight={700} color="#173a2d" variant="body2">
                        {purchase.customer_name} {purchase.customer_last_name}
                      </Typography>
                      <Typography variant="caption">{when(purchase.date)}</Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="body2" fontWeight={800} color="#173a2d">
                        {money(purchase.amount)}
                      </Typography>
                      <Typography variant="caption">+{purchase.points_earn} pts</Typography>
                    </Box>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
          <CardContent>
            <Typography variant="h6" sx={{ color: "#173a2d" }}>
              Mi Suscripcion
            </Typography>
            <Paper
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "#3d52d5",
                color: "#fff",
              }}
            >
              <Typography variant="body2" fontWeight={700}>
                {data.store.plan_name ?? "Sin plan asignado"}
              </Typography>
              <Typography variant="h5" sx={{ mt: 0.6, fontWeight: 900 }}>
                {data.store.plan_amount != null ? money(data.store.plan_amount) : "N/A"}
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.82)" }}>
                Vence: {data.store.plan_expiration_date ? when(data.store.plan_expiration_date) : "N/A"}
              </Typography>
            </Paper>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
              <Chip label={`Plan ${data.store.plan_state ?? "Desconocido"}`} sx={{ bgcolor: "#deebdf", color: "#173a2d" }} />
              <Chip label={`Payout ${data.store.payout_state ?? "Desconocido"}`} sx={{ bgcolor: "#deebdf", color: "#173a2d" }} />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

function ServicesSection({ data }: { data: DashboardData }) {
  return <StoreServicesCrudSection initialItems={data.services} />;
}

function PromotionsSection({ data }: { data: DashboardData }) {
  return <StorePromotionsCrudSection initialItems={data.benefits} />;
}

function CouponsSection({ data }: { data: DashboardData }) {
  return (
    <StoreCouponsCrudSection
      initialCoupons={data.coupons}
      couponConsumptions={data.couponConsumptions}
    />
  );
}

function ReviewsSection({ data }: { data: DashboardData }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
      <CardContent>
        <Typography variant="h6" color="#173a2d">
          Reseñas de clientes
        </Typography>
        <Stack spacing={1.2} sx={{ mt: 2 }}>
          {data.reviews.length === 0 && <Typography variant="body2">Aun no hay reseñas registradas.</Typography>}
          {data.reviews.map((review) => (
            <Paper key={review.id_comment} variant="outlined" sx={{ borderColor: "#e0ece4", p: 1.5, borderRadius: 2, bgcolor: "#f8fcf9" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#173a2d">
                    {review.customer_name} {review.customer_last_name}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {review.body}
                  </Typography>
                </Box>
                <Chip icon={<StarRoundedIcon />} label={`${review.stars}/5`} size="small" sx={{ bgcolor: "#deebdf", color: "#173a2d" }} />
              </Stack>
              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                {when(review.date)}
              </Typography>
            </Paper>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function NotificationsSection({ data }: { data: DashboardData }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
      <CardContent>
        <Typography variant="h6" color="#173a2d">
          Notificaciones
        </Typography>

        <Stack spacing={1.2} sx={{ mt: 2 }}>
          {data.notifications.length === 0 && <Typography variant="body2">No hay notificaciones para este local.</Typography>}
          {data.notifications.map((notification) => (
            <Paper key={notification.id_notification} variant="outlined" sx={{ borderColor: "#e0ece4", p: 1.5, borderRadius: 2, bgcolor: "#f8fcf9" }}>
              <Stack direction="row" gap={1.2}>
                <Avatar sx={{ bgcolor: "#deebdf", color: "#173a2d", width: 34, height: 34 }}>
                  {initials(notification.name)}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#173a2d">
                    {notification.name}
                  </Typography>
                  <Typography variant="caption">{notification.description}</Typography>
                  <Typography variant="caption" sx={{ mt: 0.6, display: "block" }}>
                    Expira: {when(notification.expiration_date)} · {notification.state === 0 ? "No leida" : "Leida"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function SubscriptionSection({ data }: { data: DashboardData }) {
  const [recText, setRecText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const currentAmount = data.store.plan_amount ?? 0;
  const sortedPlans = [...data.planOptions].sort((a, b) => a.amount - b.amount);
  const nextPlan = sortedPlans.find((p) => p.amount > currentAmount) ?? null;
  const isHighestPlan = nextPlan === null && data.planOptions.length > 0;

  async function handleUpgrade() {
    if (!nextPlan) return;
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const res = await fetch("/api/store/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: nextPlan.id_subscription,
          planName: nextPlan.name,
          planDescription: nextPlan.description,
          amount: nextPlan.amount,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setUpgradeError(err.error ?? "No se pudo iniciar el pago. Intenta de nuevo.");
        return;
      }
      const { checkoutUrl } = await res.json() as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch {
      setUpgradeError("Error de red. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setUpgrading(false);
    }
  }

  async function handleSendRec() {
    if (!recText.trim()) return;
    setSending(true);
    try {
      await fetch("/api/store/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommendation: recText }),
      });
    } catch {
      // ignore – UX shows success regardless
    } finally {
      setSending(false);
      setSubmitted(true);
    }
  }

  return (
    <Stack spacing={2}>
      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Typography variant="h6" color="#173a2d">
            Mi Suscripcion
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.6 }}>
            Estado del plan activo de este local.
          </Typography>

          <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
            <PanelCard title="Plan" value={data.store.plan_name ?? "Sin plan"} />
            <PanelCard title="Monto" value={data.store.plan_amount != null ? money(data.store.plan_amount) : "N/A"} />
            <PanelCard title="Vencimiento" value={data.store.plan_expiration_date ? when(data.store.plan_expiration_date) : "N/A"} />
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Chip label={`Estado plan: ${data.store.plan_state ?? "Desconocido"}`} sx={{ bgcolor: "#deebdf", color: "#173a2d" }} />
            <Chip label={`Estado payout: ${data.store.payout_state ?? "Desconocido"}`} sx={{ bgcolor: "#deebdf", color: "#173a2d" }} />
          </Stack>
        </CardContent>
      </Card>

      {nextPlan && (
        <Card
          elevation={0}
          sx={{
            border: "1px solid #b6d4c2",
            background: "linear-gradient(135deg, #1f4b3b 0%, #2a6a53 100%)",
            color: "#fff",
          }}
        >
          <CardContent>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.72)", letterSpacing: "0.12em" }}>
              PLAN SUPERIOR DISPONIBLE
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 900 }}>
              {nextPlan.name}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.8, color: "rgba(255,255,255,0.82)" }}>
              {nextPlan.description}
            </Typography>
            <Typography variant="h6" sx={{ mt: 1.2, fontWeight: 900 }}>
              {money(nextPlan.amount)} / mes
            </Typography>
            {upgradeError && (
              <Alert severity="error" sx={{ mt: 1.5, bgcolor: "rgba(255,255,255,0.12)", color: "#fff", "& .MuiAlert-icon": { color: "#fff" } }}>
                {upgradeError}
              </Alert>
            )}
            <Button
              variant="contained"
              disabled={upgrading}
              onClick={handleUpgrade}
              startIcon={upgrading ? <CircularProgress size={16} sx={{ color: "#1f4b3b" }} /> : undefined}
              sx={{
                mt: 2,
                bgcolor: "#fff",
                color: "#1f4b3b",
                fontWeight: 700,
                "&:hover": { bgcolor: "#e8f1ec" },
                "&.Mui-disabled": { bgcolor: "rgba(255,255,255,0.7)", color: "#1f4b3b" },
              }}
            >
              {upgrading ? "Redirigiendo..." : `Quiero actualizar al ${nextPlan.name}`}
            </Button>
          </CardContent>
        </Card>
      )}

      {isHighestPlan && (
        <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
          <CardContent>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.8 }}>
              <WorkspacePremiumRoundedIcon sx={{ color: "#1f4b3b" }} />
              <Typography variant="h6" color="#173a2d">
                Estas en nuestro plan mas alto
              </Typography>
            </Stack>
            <Typography variant="body2">
              Ya cuentas con todos los beneficios disponibles de Guander. ¿Tienes alguna idea o funcionalidad que te
              gustaria ver en la plataforma? ¡Cuentanos!
            </Typography>

            {submitted ? (
              <Alert severity="success" sx={{ mt: 2 }}>
                ¡Gracias por tu recomendacion! La tendremos muy en cuenta.
              </Alert>
            ) : (
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <TextField
                  multiline
                  rows={3}
                  fullWidth
                  label="Tu idea o recomendacion"
                  placeholder="Ej: Me gustaria poder programar descuentos automaticos por temporada..."
                  value={recText}
                  onChange={(e) => setRecText(e.target.value)}
                  size="small"
                />
                <Button
                  variant="contained"
                  disabled={!recText.trim() || sending}
                  onClick={handleSendRec}
                  startIcon={sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : undefined}
                  sx={{ alignSelf: "flex-start", bgcolor: "#1f4b3b", "&:hover": { bgcolor: "#173a2d" } }}
                >
                  {sending ? "Enviando..." : "Enviar recomendacion"}
                </Button>
              </Stack>
            )}
          </CardContent>
        </Card>
      )}
    </Stack>
  );
}

function sectionTitle(section: DashboardSection): string {
  switch (section) {
    case "dashboard":
      return "Vista general";
    case "suscripcion":
      return "Mi Suscripcion";
    case "servicios":
      return "Mis Servicios";
    case "promociones":
      return "Mis Promociones";
    case "cupones":
      return "Cupones y Consumos";
    case "reseñas":
      return "Reseñas";
    case "notificaciones":
      return "Notificaciones";
    default:
      return "Dashboard";
  }
}

function renderSection(section: DashboardSection, data: DashboardData) {
  switch (section) {
    case "dashboard":
      return <DashboardOverview data={data} />;
    case "suscripcion":
      return <SubscriptionSection data={data} />;
    case "servicios":
      return <ServicesSection data={data} />;
    case "promociones":
      return <PromotionsSection data={data} />;
    case "cupones":
      return <CouponsSection data={data} />;
    case "reseñas":
      return <ReviewsSection data={data} />;
    case "notificaciones":
      return <NotificationsSection data={data} />;
    default:
      return <DashboardOverview data={data} />;
  }
}

function SidebarContent({
  selected,
  onSelect,
}: {
  selected: DashboardSection;
  onSelect: (value: DashboardSection) => void;
}) {
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    router.push("/login");
  }

  return (
    <Box sx={{ height: "100%", px: 1.2, py: 1, display: "flex", flexDirection: "column" }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          px: 1.5,
          py: 1.5,
          border: "1px solid #d6e4da",
          bgcolor: "#f6fbf7",
        }}
      >
        <Typography variant="overline" sx={{ color: "#5f7a6d", letterSpacing: "0.12em" }}>
          GUANDER LOCAL
        </Typography>
        <Typography variant="body2" sx={{ color: "#173a2d", fontWeight: 800 }}>
          Centro de control
        </Typography>
      </Paper>

      <List sx={{ mt: 1, flexGrow: 1 }}>
        {navItems.map((item) => {
          const active = selected === item.id;
          return (
            <ListItemButton
              key={item.id}
              onClick={() => onSelect(item.id)}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                bgcolor: active ? alpha("#1f4b3b", 0.12) : "transparent",
                color: active ? "#173a2d" : "#4b675b",
                border: active ? "1px solid #c7dccc" : "1px solid transparent",
              }}
            >
              <ListItemIcon sx={{ color: "inherit", minWidth: 36 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 700 : 600 }} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ my: 1.5 }} />
      <Button fullWidth variant="contained" startIcon={<MonetizationOnRoundedIcon />} onClick={() => onSelect("suscripcion")} sx={{ bgcolor: "#1f4b3b", mb: 1 }}>
        Upgrade Plan
      </Button>
      <Button
        fullWidth
        variant="outlined"
        startIcon={<LogoutRoundedIcon />}
        onClick={handleLogout}
        sx={{ color: "#1f4b3b", borderColor: "#1f4b3b" }}
      >
        Cerrar Sesión
      </Button>
    </Box>
  );
}

export default function LocalDashboardClient({ data, error }: { data: DashboardData | null; error: string | null }) {
  const [selectedSection, setSelectedSection] = useState<DashboardSection>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const title = useMemo(() => sectionTitle(selectedSection), [selectedSection]);

  if (error) {
    return (
      <ThemeProvider theme={guanderTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", bgcolor: "#edf4ef", p: 3 }}>
          <Paper sx={{ maxWidth: 760, mx: "auto", p: 3, border: "1px solid #efb6b6", bgcolor: "#fff4f4" }}>
            <Typography color="#9b2020" fontWeight={700}>
              {error}
            </Typography>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  if (!data) {
    return (
      <ThemeProvider theme={guanderTheme}>
        <CssBaseline />
        <Box sx={{ minHeight: "100vh", bgcolor: "#edf4ef", p: 3 }}>
          <Paper sx={{ maxWidth: 760, mx: "auto", p: 3, border: "1px solid #d6e4da" }}>
            <Typography variant="h6" color="#173a2d" fontWeight={800}>
              No hay tiendas para mostrar
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Crea al menos un registro en la tabla stores para habilitar el dashboard local.
            </Typography>
          </Paper>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={guanderTheme}>
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#edf4ef" }}>
        <AppBar
          position="fixed"
          color="transparent"
          elevation={0}
          sx={{
            display: { md: "none" },
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #d8e7dd",
          }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Typography sx={{ ml: 1, fontWeight: 700, color: "#173a2d" }}>Guander Local</Typography>
          </Toolbar>
        </AppBar>

        <Box
          component="nav"
          sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
          aria-label="navegacion dashboard local"
        >
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
            <SidebarContent
              selected={selectedSection}
              onSelect={(section) => {
                setSelectedSection(section);
                setMobileOpen(false);
              }}
            />
          </Drawer>

          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", md: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                borderRight: "1px solid #d8e7dd",
                bgcolor: "#ffffff",
              },
            }}
            open
          >
            <SidebarContent selected={selectedSection} onSelect={setSelectedSection} />
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
              background: "linear-gradient(180deg, #ffffff 0%, #f6fbf8 100%)",
            }}
          >
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1}>
              <Box>
                <Typography variant="overline" sx={{ color: "#5f7a6d", letterSpacing: "0.12em" }}>
                  Dashboard Local
                </Typography>
                <Typography variant="h5" sx={{ color: "#173a2d", mt: 0.4 }}>
                  {title}
                </Typography>
              </Box>
              <Chip sx={{ bgcolor: "#deebdf", color: "#173a2d", alignSelf: "center" }} label={data.store.name} />
            </Stack>
          </Paper>

          {renderSection(selectedSection, data)}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  { id: "cupones", label: "Cupones y QR", icon: <ConfirmationNumberRoundedIcon /> },
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

type PlanBenefitRow = {
  benefit: string;
  detail: string;
};

function parsePlanBenefits(raw: string | null | undefined): PlanBenefitRow[] {
  if (!raw?.trim()) return [];

  const trimmed = raw.trim();

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => {
            if (typeof item === "string") {
              return { benefit: item, detail: "Incluido en tu plan" };
            }
            if (
              item &&
              typeof item === "object" &&
              "benefit" in item &&
              "detail" in item &&
              typeof (item as { benefit: unknown }).benefit === "string" &&
              typeof (item as { detail: unknown }).detail === "string"
            ) {
              return {
                benefit: (item as { benefit: string }).benefit,
                detail: (item as { detail: string }).detail,
              };
            }
            return null;
          })
          .filter((item): item is PlanBenefitRow => item !== null);
      }
    } catch {
      // Fallback below if JSON parse fails.
    }
  }

  return trimmed
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [benefit, detail] = line.split("|").map((part) => part.trim());
      return {
        benefit,
        detail: detail || "Incluido en tu plan",
      };
    });
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
                p: 2.2,
                borderRadius: 3,
                border: "1px solid #cfe3d5",
                background:
                  "linear-gradient(145deg, #f7fcf9 0%, #edf6f1 55%, #e6f1ea 100%)",
                boxShadow: "0 8px 20px rgba(31, 75, 59, 0.08)",
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  color: "#4d6b5f",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                }}
              >
                PLAN ACTUAL
              </Typography>
              <Typography variant="h6" sx={{ color: "#173a2d", fontWeight: 900, mt: 0.4 }}>
                {data.store.plan_name ?? "Sin plan asignado"}
              </Typography>
              <Typography variant="h4" sx={{ mt: 1, fontWeight: 900, color: "#1f4b3b", lineHeight: 1.1 }}>
                {data.store.plan_amount != null ? money(data.store.plan_amount) : "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#355d4d", mt: 0.8, fontWeight: 600 }}>
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
  const [notifications, setNotifications] = useState(data.notifications);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [expirationDays, setExpirationDays] = useState("7");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rateInfo, setRateInfo] = useState<{
    plan: { name: string; amount: number; tier: "basic" | "plus" | "premium" };
    limits: { cooldownMinutes: number; maxPerHour: number; maxPerDay: number; maxPerMonth: number };
    rate: {
      remainingHour: number;
      remainingDay: number;
      remainingMonth: number;
      sentThisMonth: number;
      cooldownRemainingMinutes: number;
    };
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRateInfo() {
      const res = await fetch("/api/store/notifications", {
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as {
        data?: {
          plan: { name: string; amount: number; tier: "basic" | "plus" | "premium" };
          limits: { cooldownMinutes: number; maxPerHour: number; maxPerDay: number; maxPerMonth: number };
          rate: {
            remainingHour: number;
            remainingDay: number;
            remainingMonth: number;
            sentThisMonth: number;
            cooldownRemainingMinutes: number;
          };
        };
      };
      if (!cancelled && json.data) {
        setRateInfo({ plan: json.data.plan, limits: json.data.limits, rate: json.data.rate });
      }
    }

    void loadRateInfo();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendPush() {
    setError(null);
    setSuccess(null);

    if (!title.trim() || !message.trim()) {
      setError("Debes completar titulo y mensaje para enviar la notificacion.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/store/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          message,
          expirationDays: Number(expirationDays),
        }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        data?: {
          notification?: {
            id_notification: number;
            name: string;
            description: string;
            expiration_date: string;
            state: number;
          };
          recipients?: number;
          plan?: { name: string; amount: number; tier: "basic" | "plus" | "premium" };
          limits?: { cooldownMinutes: number; maxPerHour: number; maxPerDay: number; maxPerMonth: number };
          rate?: {
            remainingHour: number;
            remainingDay: number;
            remainingMonth: number;
            sentThisMonth: number;
            cooldownRemainingMinutes: number;
          };
        };
      };

      if (!res.ok || !json.data?.notification) {
        setError(json.error ?? "No se pudo enviar la notificacion push.");
        if (json.data?.plan && json.data?.limits && json.data.rate) {
          setRateInfo({ plan: json.data.plan, limits: json.data.limits, rate: json.data.rate });
        }
        return;
      }

      setNotifications((prev) => [json.data!.notification!, ...prev].slice(0, 10));
      if (json.data.plan && json.data.limits && json.data.rate) {
        setRateInfo({ plan: json.data.plan, limits: json.data.limits, rate: json.data.rate });
      }
      setSuccess(
        `Notificacion enviada a ${json.data.recipients ?? 0} usuarios.`,
      );
      setTitle("");
      setMessage("");
    } catch {
      setError("Error de red al intentar enviar la notificacion.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Typography variant="h6" color="#173a2d">
            Enviar notificacion push
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Publica un aviso para tus clientes activos del local.
          </Typography>

          {rateInfo && (
            <Paper variant="outlined" sx={{ mt: 1.5, p: 1.2, borderColor: "#d6e4da", bgcolor: "#f8fcf9" }}>
              <Typography variant="caption" sx={{ color: "#173a2d", fontWeight: 700 }}>
                Plan {rateInfo.plan.name} · cupo mensual activo
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.4 }}>
                Limites: {rateInfo.limits.maxPerMonth}/mes · {rateInfo.limits.maxPerDay}/dia · {rateInfo.limits.maxPerHour}/hora ·
                espera {rateInfo.limits.cooldownMinutes} min entre envios.
              </Typography>
              <Typography variant="caption" sx={{ display: "block", mt: 0.4 }}>
                Consumidas este mes: {rateInfo.rate.sentThisMonth} · disponibles: {rateInfo.rate.remainingMonth} este mes · {rateInfo.rate.remainingDay} hoy · {rateInfo.rate.remainingHour} esta hora
                {rateInfo.rate.cooldownRemainingMinutes > 0
                  ? ` · espera actual ${rateInfo.rate.cooldownRemainingMinutes} min`
                  : ""}
              </Typography>
            </Paper>
          )}

          {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mt: 1.5 }}>{success}</Alert>}

          <Box sx={{ mt: 2, display: "grid", gap: 1.2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            <TextField
              label="Titulo"
              size="small"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              inputProps={{ maxLength: 90 }}
            />
            <TextField
              label="Expira en dias"
              size="small"
              type="number"
              value={expirationDays}
              onChange={(e) => setExpirationDays(e.target.value)}
              inputProps={{ min: 1, max: 30, step: 1 }}
            />
            <TextField
              label="Mensaje"
              multiline
              minRows={3}
              size="small"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              inputProps={{ maxLength: 450 }}
              sx={{ gridColumn: { xs: "1", md: "1 / span 2" } }}
            />
          </Box>

          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.2} sx={{ mt: 1.5 }}>
            <Button
              variant="contained"
              onClick={() => void handleSendPush()}
              disabled={sending}
              sx={{ bgcolor: "#1f4b3b" }}
              startIcon={sending ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : undefined}
            >
              {sending ? "Enviando..." : "Enviar push"}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Typography variant="h6" color="#173a2d">
            Historial de notificaciones
          </Typography>

          <Stack spacing={1.2} sx={{ mt: 2 }}>
            {notifications.length === 0 && <Typography variant="body2">No hay notificaciones para este local.</Typography>}
            {notifications.map((notification) => (
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
    </Stack>
  );
}

function SubscriptionSection({ data }: { data: DashboardData }) {
  const [recText, setRecText] = useState("");
  const [recEmail, setRecEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<number | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  const currentAmount = data.store.plan_amount ?? 0;
  const sortedPlans = [...data.planOptions].sort((a, b) => a.amount - b.amount);
  const upgradePlans = sortedPlans.filter((p) => p.amount > currentAmount);
  const isHighestPlan = upgradePlans.length === 0 && data.planOptions.length > 0;

  const currentPlanBenefits = parsePlanBenefits(data.store.plan_benefits);

  async function handleUpgrade(planId: number, planName: string, planDescription: string, amount: number) {
    setUpgradingPlanId(planId);
    setUpgradeError(null);
    try {
      const res = await fetch("/api/store/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          planName,
          planDescription,
          amount,
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
      setUpgradingPlanId(null);
    }
  }

  async function handleSendRec() {
    if (!recEmail.trim() || !recText.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/store/recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recEmail, recommendation: recText }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setUpgradeError(err.error ?? "No se pudo enviar la sugerencia.");
        return;
      }
    } catch {
      setUpgradeError("Error de red. Verificá tu conexión e intentá de nuevo.");
      return;
    } finally {
      setSending(false);
    }
    setSubmitted(true);
    setUpgradeError(null);
    setRecText("");
    setRecEmail("");
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

          <Paper variant="outlined" sx={{ mt: 2.2, borderColor: "#d6e4da", borderRadius: 2.5, overflow: "hidden" }}>
            <Box sx={{ px: 1.6, py: 1.2, bgcolor: "#f3f9f5", borderBottom: "1px solid #dcebe2" }}>
              <Typography variant="subtitle2" sx={{ color: "#173a2d", fontWeight: 800 }}>
                Beneficios del plan actual
              </Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Beneficio</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Detalle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentPlanBenefits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2}>
                      No hay beneficios configurados para este plan en la base de datos.
                    </TableCell>
                  </TableRow>
                )}
                {currentPlanBenefits.map((item, index) => (
                  <TableRow key={`${item.benefit}-${index}`}>
                    <TableCell>{item.benefit}</TableCell>
                    <TableCell>{item.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </CardContent>
      </Card>

      {upgradePlans.length > 0 && (
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
              PLANES SUPERIORES DISPONIBLES
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 900 }}>
              Elige el plan al que quieres cambiar
            </Typography>

            <Stack spacing={1.2} sx={{ mt: 1.4 }}>
              {upgradePlans.map((plan) => (
                <Paper
                  key={plan.id_subscription}
                  sx={{
                    p: 1.4,
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    gap={1}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 900 }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.2 }}>
                        {plan.description}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.6, fontWeight: 800 }}>
                        {money(plan.amount)} / mes
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      disabled={upgradingPlanId === plan.id_subscription}
                      onClick={() =>
                        void handleUpgrade(
                          plan.id_subscription,
                          plan.name,
                          plan.description,
                          plan.amount,
                        )
                      }
                      startIcon={
                        upgradingPlanId === plan.id_subscription ? (
                          <CircularProgress size={16} sx={{ color: "#1f4b3b" }} />
                        ) : undefined
                      }
                      sx={{
                        bgcolor: "#fff",
                        color: "#1f4b3b",
                        fontWeight: 700,
                        "&:hover": { bgcolor: "#e8f1ec" },
                        "&.Mui-disabled": {
                          bgcolor: "rgba(255,255,255,0.7)",
                          color: "#1f4b3b",
                        },
                      }}
                    >
                      {upgradingPlanId === plan.id_subscription
                        ? "Redirigiendo..."
                        : `Upgrade a ${plan.name}`}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>

            {upgradeError && (
              <Alert severity="error" sx={{ mt: 1.5, bgcolor: "rgba(255,255,255,0.12)", color: "#fff", "& .MuiAlert-icon": { color: "#fff" } }}>
                {upgradeError}
              </Alert>
            )}
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
                  fullWidth
                  label="Tu email"
                  placeholder="tu-email@dominio.com"
                  value={recEmail}
                  onChange={(e) => setRecEmail(e.target.value)}
                  size="small"
                />
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
                  disabled={!recEmail.trim() || !recText.trim() || sending}
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
      return "Cupones y QR";
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

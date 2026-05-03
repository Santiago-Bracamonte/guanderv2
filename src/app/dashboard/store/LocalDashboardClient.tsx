"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  Collapse,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import SearchIcon from "@mui/icons-material/Search";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import AddPhotoAlternateRoundedIcon from "@mui/icons-material/AddPhotoAlternateRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ThemeProvider, alpha, createTheme } from "@mui/material/styles";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { DashboardData } from "./types";
import { getPlanLimitsFromBenefits } from "@/lib/plan-limits";
import {
  StoreCouponManagementSection,
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
  | "notificaciones"
  | "perfil"
  | "soporte";

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
  { id: "promociones", label: "Mis Cupones", icon: <CampaignRoundedIcon /> },
  { id: "cupones", label: "Generar Consumo", icon: <ConfirmationNumberRoundedIcon /> },
  { id: "reseñas", label: "Reseñas", icon: <ReviewsRoundedIcon /> },
  { id: "notificaciones", label: "Notificaciones", icon: <NotificationsActiveRoundedIcon /> },
  { id: "perfil", label: "Mi Perfil", icon: <StorefrontRoundedIcon /> },
  { id: "soporte", label: "Soporte / Mensajes", icon: <SupportAgentRoundedIcon /> },
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

function DashboardOverview({ data, userRole }: { data: DashboardData; userRole?: string }) {
  const avgStars = data.avgStoreRating > 0 ? data.avgStoreRating.toFixed(1) : data.store.stars.toFixed(1);
  const payoutPending = data.store.payout_state === "pendiente";
  const planLimits = getPlanLimitsFromBenefits(data.store.plan_benefits);

  return (
    <Stack spacing={2.2}>
      {payoutPending && (
        <Card
          elevation={0}
          sx={{
            border: "1.5px solid #f59e0b",
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
            <Box sx={{ fontSize: 28, lineHeight: 1 }}>⚠️</Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#92400e">
                Tu suscripción está pendiente de pago
              </Typography>
              <Typography variant="body2" color="#78350f" sx={{ mt: 0.4 }}>
                Plan: <strong>{data.store.plan_name ?? "Sin asignar"}</strong>
                {data.store.plan_amount != null && (
                  <> — <strong>{money(data.store.plan_amount)}/mes</strong></>
                )}
              </Typography>
              <Typography variant="body2" color="#78350f" sx={{ mt: 0.6 }}>
                El equipo de Guander se comunicará con vos para coordinar el cobro. Podés ver los detalles en la pestaña <strong>Mi Suscripción</strong>.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
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
                {userRole === "professional" ? "PANEL PROFESIONAL GUANDER" : "PANEL LOCAL GUANDER"}
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

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, minmax(0, 1fr))" } }}>
        <PanelCard title="Servicios activos" value={String(data.servicesCount)} />
        <PanelCard title="Cupones activos" value={String(data.activeCouponsCount)} />
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
              <Box sx={{ mt: 1.5, display: "grid", gap: 0.7, gridTemplateColumns: "1fr 1fr" }}>
                {[
                  { label: "Fotos", value: `${planLimits.maxPhotos}` },
                  { label: "Servicios", value: planLimits.maxServices === -1 ? "Ilimitados" : String(planLimits.maxServices) },
                  { label: "Cupones", value: String(planLimits.maxCoupons) },
                  { label: "Notificaciones/mes", value: String(planLimits.maxNotificationsPerMonth) },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1, py: 0.5, bgcolor: "#fff", borderRadius: 1.5, border: "1px solid #dde9e3" }}>
                    <Typography variant="caption" sx={{ color: "#4d6b5f", fontWeight: 600 }}>{label}</Typography>
                    <Typography variant="caption" sx={{ color: "#1f4b3b", fontWeight: 800 }}>{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
              <Chip label={`Plan ${data.store.plan_state ?? "Desconocido"}`} sx={{ bgcolor: "#deebdf", color: "#173a2d" }} />
              <Chip
                label={`Pago ${data.store.payout_state ?? "Desconocido"}`}
                sx={{
                  bgcolor: payoutPending ? "#fef3c7" : "#deebdf",
                  color: payoutPending ? "#92400e" : "#173a2d",
                  fontWeight: payoutPending ? 700 : 400,
                }}
              />
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

function ServicesSection({ data }: { data: DashboardData }) {
  return <StoreServicesCrudSection initialItems={data.services} planLimits={getPlanLimitsFromBenefits(data.store.plan_benefits)} />;
}

function PromotionsSection({ data }: { data: DashboardData }) {
  return <StoreCouponManagementSection planLimits={getPlanLimitsFromBenefits(data.store.plan_benefits)} />;
}

function CouponsSection({ data }: { data: DashboardData }) {
  return <StoreCouponsCrudSection activeCoupons={data.coupons} />;
}

function ReviewsSection({ data }: { data: DashboardData }) {
  const PAGE_SIZE = 5;
  const [repliesByComment, setRepliesByComment] = useState<Record<number, DashboardData["reviewReplies"]>>(() => {
    const grouped: Record<number, DashboardData["reviewReplies"]> = {};
    for (const reply of data.reviewReplies) {
      grouped[reply.fk_comment_id] = [...(grouped[reply.fk_comment_id] ?? []), reply];
    }
    return grouped;
  });
  const [reviewsPage, setReviewsPage] = useState(1);
  const [draftReplyByComment, setDraftReplyByComment] = useState<Record<number, string>>({});
  const [sendingCommentId, setSendingCommentId] = useState<number | null>(null);
  const [feedbackByComment, setFeedbackByComment] = useState<Record<number, { type: "error" | "success"; message: string }>>({});
  const [openReplyId, setOpenReplyId] = useState<number | null>(null);
  const [reviewSearch, setReviewSearch] = useState("");
  const [reviewSort, setReviewSort] = useState<"recientes" | "mas_valorado" | "menos_valorado">("recientes");
  const [closedReviews, setClosedReviews] = useState<Set<number>>(new Set());

  const filteredSortedReviews = useMemo(() => {
    const term = reviewSearch.trim().toLowerCase();
    let list = term
      ? data.reviews.filter(
          (r) =>
            r.body.toLowerCase().includes(term) ||
            `${r.customer_name} ${r.customer_last_name}`.toLowerCase().includes(term),
        )
      : [...data.reviews];
    if (reviewSort === "recientes") list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    else if (reviewSort === "mas_valorado") list.sort((a, b) => b.stars - a.stars);
    else list.sort((a, b) => a.stars - b.stars);
    return list;
  }, [data.reviews, reviewSearch, reviewSort]);

  const reviewsTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredSortedReviews.length / PAGE_SIZE)),
    [filteredSortedReviews.length],
  );
  const safeReviewsPage = Math.min(reviewsPage, reviewsTotalPages);
  const paginatedReviews = useMemo(() => {
    const start = (safeReviewsPage - 1) * PAGE_SIZE;
    return filteredSortedReviews.slice(start, start + PAGE_SIZE);
  }, [filteredSortedReviews, safeReviewsPage]);

  useEffect(() => {
    if (reviewsPage > reviewsTotalPages) {
      setReviewsPage(reviewsTotalPages);
    }
  }, [reviewsPage, reviewsTotalPages]);

  async function handleReply(commentId: number) {
    const body = (draftReplyByComment[commentId] ?? "").trim();
    if (!body) {
      setFeedbackByComment((prev) => ({
        ...prev,
        [commentId]: { type: "error", message: "Escribe una respuesta antes de enviar." },
      }));
      return;
    }

    setSendingCommentId(commentId);
    setFeedbackByComment((prev) => {
      const next = { ...prev };
      delete next[commentId];
      return next;
    });

    try {
      const res = await fetch("/api/store/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, body }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        data?: {
          reply: DashboardData["reviewReplies"][number];
        };
      };

      if (!res.ok || !json.data?.reply) {
        setFeedbackByComment((prev) => ({
          ...prev,
          [commentId]: { type: "error", message: json.error ?? "No se pudo responder la reseña." },
        }));
        return;
      }

      const newReply = json.data.reply;

      setRepliesByComment((prev) => ({
        ...prev,
        [commentId]: [...(prev[commentId] ?? []), newReply],
      }));
      setDraftReplyByComment((prev) => ({ ...prev, [commentId]: "" }));
      setOpenReplyId(null);
      setFeedbackByComment((prev) => ({
        ...prev,
        [commentId]: { type: "success", message: "Respuesta enviada y notificación creada." },
      }));
    } catch {
      setFeedbackByComment((prev) => ({
        ...prev,
        [commentId]: { type: "error", message: "Error de red al responder la reseña." },
      }));
    } finally {
      setSendingCommentId(null);
    }
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
      <CardContent>
        <Typography variant="h6" color="#173a2d">
          Reseñas de clientes
        </Typography>

        {/* Filters */}
        <Stack spacing={1.5} sx={{ mt: 2, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar por nombre o comentario..."
            value={reviewSearch}
            onChange={(e) => { setReviewSearch(e.target.value); setReviewsPage(1); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
            fullWidth
          />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {(["recientes", "mas_valorado", "menos_valorado"] as const).map((opt) => (
              <Chip
                key={opt}
                label={opt === "recientes" ? "Más recientes" : opt === "mas_valorado" ? "Más valorado" : "Menos valorado"}
                size="small"
                onClick={() => { setReviewSort(opt); setReviewsPage(1); }}
                variant={reviewSort === opt ? "filled" : "outlined"}
                sx={{
                  cursor: "pointer",
                  fontWeight: 700,
                  ...(reviewSort === opt
                    ? { bgcolor: "#1f4b3b", color: "#fff", borderColor: "#1f4b3b" }
                    : { color: "#1f4b3b", borderColor: "rgba(31,75,59,0.4)" }),
                }}
              />
            ))}
          </Stack>
        </Stack>

        <Stack spacing={1.2}>
          {filteredSortedReviews.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {reviewSearch.trim() ? "No se encontraron reseñas con ese criterio." : "Aun no hay reseñas registradas."}
            </Typography>
          )}
          {paginatedReviews.map((review) => {
            const isClosed = closedReviews.has(review.id_comment);
            return (
            <Paper key={review.id_comment} variant="outlined" sx={{ borderColor: "#e0ece4", p: 1.5, borderRadius: 2, bgcolor: "#f8fcf9" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#173a2d">
                    {review.customer_name} {review.customer_last_name}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Chip icon={<StarRoundedIcon />} label={`${review.stars}/5`} size="small" sx={{ bgcolor: "#deebdf", color: "#173a2d" }} />
                  <IconButton
                    size="small"
                    onClick={() => setClosedReviews((prev) => {
                      const next = new Set(prev);
                      if (next.has(review.id_comment)) next.delete(review.id_comment);
                      else next.add(review.id_comment);
                      return next;
                    })}
                    sx={{ color: "#5a7368" }}
                  >
                    <KeyboardArrowDownRoundedIcon
                      sx={{
                        transition: "transform 0.25s",
                        transform: isClosed ? "rotate(0deg)" : "rotate(180deg)",
                        fontSize: 18,
                      }}
                    />
                  </IconButton>
                </Stack>
              </Stack>

              <Collapse in={!isClosed} unmountOnExit>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {review.body}
                </Typography>

                <Stack spacing={1} sx={{ mt: 1.2, pl: { xs: 0, sm: 1.5 }, borderLeft: { xs: "none", sm: "2px solid #dce9e0" } }}>
                  {(repliesByComment[review.id_comment] ?? []).map((reply) => (
                    <Paper key={reply.id_comment_reply} variant="outlined" sx={{ p: 1, borderColor: "#dbe8df", bgcolor: "#fcfefd" }}>
                      <Typography variant="caption" sx={{ color: "#1f4b3b", fontWeight: 700 }}>
                        {reply.responder_name}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.3 }}>
                        {reply.body}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#5a7368", display: "block", mt: 0.4 }}>
                        {when(reply.date)}
                      </Typography>
                    </Paper>
                  ))}

                  {/* Toggle responder */}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ReplyRoundedIcon />}
                    endIcon={
                      <KeyboardArrowDownRoundedIcon
                        sx={{
                          transition: "transform 0.25s",
                          transform: openReplyId === review.id_comment ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      />
                    }
                    onClick={() =>
                      setOpenReplyId((prev) =>
                        prev === review.id_comment ? null : review.id_comment,
                      )
                    }
                    sx={{
                      alignSelf: "flex-start",
                      color: "#1f4b3b",
                      borderColor: "rgba(31,75,59,0.35)",
                      fontWeight: 700,
                      fontSize: "0.75rem",
                      "&:hover": { borderColor: "#1f4b3b", bgcolor: "rgba(31,75,59,0.05)" },
                    }}
                  >
                    {openReplyId === review.id_comment ? "Cerrar" : "Responder"}
                  </Button>

                  <Collapse in={openReplyId === review.id_comment} unmountOnExit>
                    <Stack spacing={1} sx={{ mt: 0.5 }}>
                      <TextField
                        size="small"
                        multiline
                        minRows={2}
                        label="Responder reseña"
                        value={draftReplyByComment[review.id_comment] ?? ""}
                        onChange={(e) =>
                          setDraftReplyByComment((prev) => ({
                            ...prev,
                            [review.id_comment]: e.target.value,
                          }))
                        }
                      />
                      <Stack direction="row" justifyContent="flex-end">
                        <Button
                          size="small"
                          variant="contained"
                          sx={{ bgcolor: "#1f4b3b" }}
                          onClick={() => void handleReply(review.id_comment)}
                          disabled={sendingCommentId === review.id_comment}
                        >
                          {sendingCommentId === review.id_comment ? "Enviando..." : "Enviar respuesta"}
                        </Button>
                      </Stack>
                      {feedbackByComment[review.id_comment] && (
                        <Alert severity={feedbackByComment[review.id_comment].type} sx={{ py: 0 }}>
                          {feedbackByComment[review.id_comment].message}
                        </Alert>
                      )}
                    </Stack>
                  </Collapse>
                </Stack>
              </Collapse>

              <Typography variant="caption" sx={{ mt: 1, display: "block" }}>
                {when(review.date)}
              </Typography>
            </Paper>
            );
          })}
        </Stack>

        {filteredSortedReviews.length > PAGE_SIZE && (
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ color: "#4b675b" }}>
              Pagina {safeReviewsPage} de {reviewsTotalPages} · {data.reviews.length} reseñas
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                variant="outlined"
                disabled={safeReviewsPage === 1}
                onClick={() => setReviewsPage((prev) => Math.max(prev - 1, 1))}
              >
                Anterior
              </Button>
              <Button
                size="small"
                variant="outlined"
                disabled={safeReviewsPage >= reviewsTotalPages}
                onClick={() => setReviewsPage((prev) => Math.min(prev + 1, reviewsTotalPages))}
              >
                Siguiente
              </Button>
            </Stack>
          </Stack>
        )}
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
  const payoutPending = data.store.payout_state === "pendiente";
  const [recText, setRecText] = useState("");
  const [recEmail, setRecEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [upgradingPlanId, setUpgradingPlanId] = useState<number | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const currentAmount = data.store.plan_amount ?? 0;
  const sortedPlans = [...data.planOptions].sort((a, b) => a.amount - b.amount);
  const upgradePlans = sortedPlans.filter((p) => p.amount > currentAmount);
  const downgradePlans = sortedPlans.filter((p) => p.amount > 0 && p.amount < currentAmount);
  const isHighestPlan = upgradePlans.length === 0 && data.planOptions.length > 0;

  // Expiry warning
  const expiryDate = data.store.plan_expiration_date ? new Date(data.store.plan_expiration_date) : null;
  const daysLeft = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000) : null;
  const isExpired = daysLeft !== null && daysLeft <= 0;
  const expiringSOON = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;

  const currentPlanBenefits = parsePlanBenefits(data.store.plan_benefits);
  const planLimits = getPlanLimitsFromBenefits(data.store.plan_benefits);
  const allPlanBenefits = [...currentPlanBenefits];

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

  const [isCanceling, setIsCanceling] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);

  async function handleRenew() {
    const currentPlan = data.planOptions.find((p) => p.name === data.store.plan_name && p.amount === data.store.plan_amount);
    if (!currentPlan) {
      setUpgradeError("No se pudo identificar el plan actual.");
      return;
    }
    setIsRenewing(true);
    setUpgradeError(null);
    try {
      const res = await fetch("/api/store/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: currentPlan.id_subscription,
          planName: currentPlan.name,
          planDescription: currentPlan.description,
          amount: currentPlan.amount,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setUpgradeError(err.error ?? "No se pudo iniciar la renovación. Intenta de nuevo.");
        return;
      }
      const { checkoutUrl } = await res.json() as { checkoutUrl: string };
      window.location.href = checkoutUrl;
    } catch {
      setUpgradeError("Error de red. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setIsRenewing(false);
    }
  }

  async function handleCancel() {
    if (!confirm("¿Estás seguro que deseas cancelar tu suscripción actual? Perderás los beneficios correspondientes a este plan.")) return;
    setIsCanceling(true);
    setUpgradeError(null);
    try {
      const res = await fetch("/api/store/subscribe/cancel", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setUpgradeError(err.error ?? "Error al cancelar suscripción");
        return;
      }
      window.location.reload();
    } catch {
      setUpgradeError("Error de red. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setIsCanceling(false);
    }
  }

  async function handleUploadReceipt() {
    if (!receiptFile) return;
    setUploadingReceipt(true);
    setUpgradeError(null);
    setUploadSuccess(false);
    try {
      // Mock File Upload - Generate base64 or object URL
      const fileUrl = window.URL.createObjectURL(receiptFile);
      
      const res = await fetch("/api/store/subscribe/upload-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          proofUrl: fileUrl, 
          description: `File: ${receiptFile.name}` 
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        setUpgradeError(err.error ?? "Error al subir comprobante");
        return;
      }
      setUploadSuccess(true);
      setReceiptFile(null);
    } catch {
      setUpgradeError("Error de red. Verificá tu conexión e intentá de nuevo.");
    } finally {
      setUploadingReceipt(false);
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
            <Chip
              label={`Estado pago: ${data.store.payout_state ?? "Desconocido"}`}
              sx={{
                bgcolor: payoutPending ? "#fef3c7" : "#deebdf",
                color: payoutPending ? "#92400e" : "#173a2d",
                fontWeight: payoutPending ? 700 : 400,
              }}
            />
          </Stack>

          {/* Payment pending banner */}
          {payoutPending && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              <strong>Pago pendiente.</strong> Tu suscripción <strong>{data.store.plan_name}</strong> está pendiente de pago.
              El equipo de Guander se comunicará con vos para coordinar el cobro. Hasta entonces tu cuenta puede tener acceso limitado.
            </Alert>
          )}

          {/* Expiry banners */}
          {isExpired && (
            <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
              <strong>Tu suscripción venció</strong> el {data.store.plan_expiration_date ? when(data.store.plan_expiration_date) : "—"}.
              Renovála para seguir usando todas las funcionalidades de Guander.
            </Alert>
          )}
          {expiringSOON && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
              <strong>Tu suscripción vence en {daysLeft} {daysLeft === 1 ? "día" : "días"}</strong> ({data.store.plan_expiration_date ? when(data.store.plan_expiration_date) : "—"}).
              Asegurate de tener el pago coordinado para no perder acceso.
            </Alert>
          )}

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
                {allPlanBenefits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2}>
                      No hay beneficios configurados para este plan en la base de datos.
                    </TableCell>
                  </TableRow>
                )}
                {allPlanBenefits.map((item, index) => (
                  <TableRow key={`${item.benefit}-${index}`}>
                    <TableCell>{item.benefit}</TableCell>
                    <TableCell>{item.detail}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {data.store.plan_amount != null && data.store.plan_amount > 0 && (
            <Box sx={{ mt: 3 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={() => void handleRenew()}
                  disabled={isRenewing || isCanceling}
                  sx={{ bgcolor: "#1f4b3b", "&:hover": { bgcolor: "#173a2d" } }}
                >
                  {isRenewing ? "Redirigiendo..." : "Renovar Suscripción"}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => void handleCancel()}
                  disabled={isRenewing || isCanceling}
                >
                  {isCanceling ? "Cancelando..." : "Cancelar Suscripción"}
                </Button>
              </Stack>
              
              <Box sx={{ mt: 3, p: 2, border: '1px dashed #b6d4c2', borderRadius: 2, bgcolor: '#f8fcf9' }}>
                <Typography variant="subtitle2" sx={{ color: "#173a2d", mb: 1, fontWeight: 'bold' }}>
                  Subir Comprobante de Pago Manual (PDF, JPG, PNG)
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Button variant="outlined" component="label" disabled={uploadingReceipt}>
                    Seleccionar Archivo
                    <input 
                      type="file" 
                      hidden 
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    />
                  </Button>
                  <Typography variant="caption">{receiptFile ? receiptFile.name : "Ningún archivo seleccionado"}</Typography>
                </Stack>
                {receiptFile && (
                  <Button 
                    variant="contained" 
                    sx={{ mt: 2, bgcolor: "#1f4b3b", "&:hover": { bgcolor: "#173a2d" } }}
                    onClick={() => void handleUploadReceipt()}
                    disabled={uploadingReceipt}
                  >
                    {uploadingReceipt ? "Subiendo..." : "Confirmar Subida"}
                  </Button>
                )}
                {uploadSuccess && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Comprobante subido. Esperando aprobación del administrador.
                  </Alert>
                )}
              </Box>
            </Box>
          )}
          {upgradeError && (
             <Typography color="error" variant="body2" sx={{ mt: 1 }}>{upgradeError}</Typography>
          )}
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
                    bgcolor: "rgba(255,255,255,0.13)",
                    border: "1px solid rgba(255,255,255,0.28)",
                  }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    gap={1}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 900, color: "#fff" }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.82)", mt: 0.2 }}>
                        {plan.description}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.6, fontWeight: 800, color: "#a8e6c0" }}>
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

      {/* Downgrade options */}
      {downgradePlans.length > 0 && (
        <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
          <CardContent>
            <Typography variant="h6" color="#173a2d" sx={{ mb: 0.5 }}>
              Bajar de plan
            </Typography>
            <Typography variant="body2" sx={{ mb: 1.8 }}>
              Podés cambiar a un plan con menor costo. El cambio aplica al próximo período.
            </Typography>
            <Stack spacing={1.2}>
              {downgradePlans.map((plan) => (
                <Paper
                  key={plan.id_subscription}
                  variant="outlined"
                  sx={{ p: 1.4, borderRadius: 2, borderColor: "#d6e4da" }}
                >
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                    gap={1}
                  >
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 700, color: "#173a2d" }}>
                        {plan.name}
                      </Typography>
                      {plan.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.2 }}>
                          {plan.description}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ mt: 0.4, fontWeight: 700, color: "#1f4b3b" }}>
                        {money(plan.amount)} / mes
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
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
                          <CircularProgress size={16} />
                        ) : undefined
                      }
                      sx={{
                        borderColor: "#1f4b3b",
                        color: "#1f4b3b",
                        fontWeight: 600,
                        "&:hover": { bgcolor: "#f3f9f5", borderColor: "#173a2d" },
                      }}
                    >
                      {upgradingPlanId === plan.id_subscription
                        ? "Redirigiendo..."
                        : `Cambiar a ${plan.name}`}
                    </Button>
                  </Stack>
                </Paper>
              ))}
            </Stack>
            {upgradeError && (
              <Alert severity="error" sx={{ mt: 1.5 }}>
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

// ─── Map location picker ─────────────────────────────────────────────────────

const pickerMarkerIcon =
  typeof window !== "undefined"
    ? L.icon({ iconUrl: "/Marcador.png", iconSize: [52, 52], iconAnchor: [26, 32] })
    : null;

function parseLatLng(raw: string): { lat: number; lng: number } | null {
  const parts = raw.split(",").map((v) => Number(v.trim()));
  if (parts.length !== 2) return null;
  const [lat, lng] = parts;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  return { lat, lng };
}

function ProfileMapModal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function ProfileMapPicker({
  open,
  initialLocation,
  onClose,
  onConfirm,
}: {
  open: boolean;
  initialLocation: string;
  onClose: () => void;
  onConfirm: (payload: { location: string; address: string }) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [resolvingAddress, setResolvingAddress] = useState(false);

  useEffect(() => {
    if (!open || !mapContainerRef.current) return;
    const initial = parseLatLng(initialLocation) ?? { lat: -34.603722, lng: -58.381592 };
    setSelectedLocation(initial);
    setSelectedAddress("");
    let cancelled = false;

    const reverseGeocode = async (lat: number, lng: number) => {
      setResolvingAddress(true);
      try {
        const res = await fetch(`/api/admin/locales/reverse-geocode?lat=${lat}&lng=${lng}`);
        if (!res.ok) { setSelectedAddress(""); return; }
        const data = (await res.json()) as { address?: string };
        if (!cancelled) setSelectedAddress(data.address ?? "");
      } catch {
        if (!cancelled) setSelectedAddress("");
      } finally {
        if (!cancelled) setResolvingAddress(false);
      }
    };

    const icon = pickerMarkerIcon ?? L.icon({ iconUrl: "/Marcador.png", iconSize: [52, 52], iconAnchor: [26, 32] });
    const map = L.map(mapContainerRef.current, { zoomControl: true, scrollWheelZoom: true });
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    map.setView([initial.lat, initial.lng], 15);
    const marker = L.marker([initial.lat, initial.lng], { draggable: true, icon }).addTo(map);
    markerRef.current = marker;
    void reverseGeocode(initial.lat, initial.lng);

    const updateLocation = (lat: number, lng: number) => {
      marker.setLatLng([lat, lng]);
      setSelectedLocation({ lat, lng });
      void reverseGeocode(lat, lng);
    };
    map.on("click", (e: L.LeafletMouseEvent) => updateLocation(e.latlng.lat, e.latlng.lng));
    marker.on("dragend", () => { const p = marker.getLatLng(); updateLocation(p.lat, p.lng); });
    requestAnimationFrame(() => map.invalidateSize());
    setTimeout(() => map.invalidateSize(), 120);

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [open, initialLocation]);

  return (
    <ProfileMapModal open={open} onClose={onClose}>
      <div style={{ padding: "24px 24px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 800, fontSize: 18, color: "#173a2d" }}>Elegir ubicación en mapa</span>
        <button onClick={onClose} style={{ cursor: "pointer", background: "none", border: "none", fontSize: 20, color: "#555" }}>✕</button>
      </div>
      <div style={{ padding: "0 24px 16px" }}>
        <p style={{ fontSize: 13, color: "#4b675b", marginBottom: 12 }}>
          Hacé click en el punto exacto o arrastrá el pin para ajustar la ubicación.
        </p>
        <div ref={mapContainerRef} style={{ width: "100%", minHeight: 380, borderRadius: 12, overflow: "hidden", border: "1px solid #d6e4da" }} />
        <div style={{ marginTop: 12, background: "#f5f8f0", borderRadius: 12, padding: 12, border: "1px solid #d6e4da" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#4b675b", marginBottom: 4 }}>Ubicación seleccionada</p>
          <p style={{ fontSize: 13, color: "#173a2d" }}>
            {selectedLocation ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}` : "Seleccioná un punto en el mapa"}
          </p>
          <p style={{ fontSize: 12, marginTop: 6, color: "#4b675b" }}>
            {resolvingAddress ? "Buscando dirección..." : selectedAddress || ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: "10px 0", borderRadius: 12, border: "none", background: "#c5cdb3", color: "#3d4f35", fontWeight: 700, cursor: "pointer", fontSize: 14 }}
          >Cancelar</button>
          <button
            onClick={() => {
              if (!selectedLocation) return;
              onConfirm({
                location: `${selectedLocation.lat.toFixed(6)},${selectedLocation.lng.toFixed(6)}`,
                address: selectedAddress,
              });
            }}
            disabled={!selectedLocation}
            style={{ flex: 2, padding: "10px 0", borderRadius: 12, border: "none", background: selectedLocation ? "#1f4b3b" : "#aaa", color: "#fff", fontWeight: 700, cursor: selectedLocation ? "pointer" : "not-allowed", fontSize: 14 }}
          >Confirmar ubicación</button>
        </div>
      </div>
    </ProfileMapModal>
  );
}

// ─── Store profile editor ─────────────────────────────────────────────────────

type CategoryOption = { id_category: number; name: string };

type ProfileStore = {
  name: string;
  description: string;
  address: string;
  location: string;
  image_url: string | null;
  gallery_urls: string[];
  fk_category: number;
  schedule_week: string | null;
  schedule_weekend: string | null;
  schedule_sunday: string | null;
  social_web: string | null;
  social_instagram: string | null;
  social_twitter: string | null;
  social_whatsapp: string | null;
};

function StoreProfileSection({ data }: { data: DashboardData }) {
  const planLimits = getPlanLimitsFromBenefits(data.store.plan_benefits);
  const [form, setForm] = useState<ProfileStore>({
    name: data.store.name,
    description: data.store.description,
    address: data.store.address,
    location: data.store.location,
    image_url: null,
    gallery_urls: [],
    fk_category: 0,
    schedule_week: "",
    schedule_weekend: "",
    schedule_sunday: "",
    social_web: null,
    social_instagram: null,
    social_twitter: null,
    social_whatsapp: null,
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        const res = await fetch("/api/store/profile", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
          data?: { store: ProfileStore; categories: CategoryOption[] };
        };
        if (!cancelled && json.data) {
          const s = json.data.store;
          const gallery: string[] = Array.isArray((s as unknown as { gallery_urls: unknown }).gallery_urls)
            ? (s as unknown as { gallery_urls: string[] }).gallery_urls
            : s.image_url ? [s.image_url] : [];
          setForm({
            name: s.name ?? data.store.name,
            description: s.description ?? data.store.description,
            address: s.address ?? data.store.address,
            location: s.location ?? data.store.location,
            image_url: s.image_url ?? null,
            gallery_urls: gallery,
            fk_category: s.fk_category ?? 0,
            schedule_week: s.schedule_week ?? "",
            schedule_weekend: s.schedule_weekend ?? "",
            schedule_sunday: s.schedule_sunday ?? "",
            social_web: s.social_web ?? null,
            social_instagram: s.social_instagram ?? null,
            social_twitter: s.social_twitter ?? null,
            social_whatsapp: s.social_whatsapp ?? null,
          });
          setCategories(json.data.categories);
        }
      } catch {
        // use pre-filled defaults from data.store
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so the same file can be picked again
    e.target.value = "";
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        setError(json.error ?? "No se pudo subir la imagen.");
      } else {
        setForm((prev) => ({
          ...prev,
          gallery_urls: [...prev.gallery_urls, json.url!],
          image_url: prev.gallery_urls.length === 0 ? json.url! : prev.image_url,
        }));
      }
    } catch {
      setError("Error de red al subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("El nombre del local es requerido.");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/store/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          image_url: form.gallery_urls[0] ?? null,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !json.success) {
        setError(json.error ?? "No se pudo guardar los cambios.");
        return;
      }
      setSuccess("Perfil actualizado correctamente.");
    } catch {
      setError("Error de red al guardar los cambios.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Typography variant="h6" color="#173a2d">
            Datos del local
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Editá el nombre, descripción, dirección, foto y horarios de tu
            local.
          </Typography>

          {loading ? (
            <Stack alignItems="center" sx={{ mt: 4, mb: 2 }}>
              <CircularProgress size={28} sx={{ color: "#1f4b3b" }} />
            </Stack>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {success}
                </Alert>
              )}

              {/* Photo gallery */}
              <Box sx={{ mt: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography variant="body2" fontWeight={700} color="#173a2d">
                    Fotos del local
                  </Typography>
                  <Chip
                    label={`${form.gallery_urls.length} / ${planLimits.maxPhotos}`}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      bgcolor: form.gallery_urls.length >= planLimits.maxPhotos ? "#fef3c7" : "#deebdf",
                      color: form.gallery_urls.length >= planLimits.maxPhotos ? "#92400e" : "#173a2d",
                      fontSize: "0.68rem",
                    }}
                  />
                </Stack>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  {form.gallery_urls.map((url, idx) => (
                    <Box
                      key={url + idx}
                      sx={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: 8,
                          border: "1px solid #d6e4da",
                          display: "block",
                        }}
                      />
                      {idx === 0 && (
                        <Chip
                          label="Principal"
                          size="small"
                          sx={{
                            position: "absolute",
                            bottom: 4,
                            left: 4,
                            fontSize: "0.58rem",
                            height: 18,
                            bgcolor: "rgba(31,75,59,0.85)",
                            color: "#fff",
                            fontWeight: 700,
                          }}
                        />
                      )}
                      <IconButton
                        size="small"
                        title="Eliminar foto"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            gallery_urls: p.gallery_urls.filter((_, i) => i !== idx),
                            image_url: idx === 0 ? (p.gallery_urls[1] ?? null) : p.image_url,
                          }))
                        }
                        sx={{
                          position: "absolute",
                          top: -8,
                          right: -8,
                          width: 22,
                          height: 22,
                          bgcolor: "#fff",
                          border: "1px solid #d6e4da",
                          "&:hover": { bgcolor: "#fee2e2", borderColor: "#fca5a5" },
                          p: 0,
                        }}
                      >
                        <CloseRoundedIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                    </Box>
                  ))}

                  {form.gallery_urls.length < planLimits.maxPhotos && (
                    <Box
                      onClick={() => !uploading && fileInputRef.current?.click()}
                      sx={{
                        width: 96,
                        height: 96,
                        borderRadius: 2,
                        border: "2px dashed #b6d4c2",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: uploading ? "default" : "pointer",
                        bgcolor: "#f3f9f5",
                        gap: 0.5,
                        flexShrink: 0,
                        transition: "background 0.15s",
                        "&:hover": { bgcolor: uploading ? "#f3f9f5" : "#eaf3ee" },
                      }}
                    >
                      {uploading ? (
                        <CircularProgress size={22} sx={{ color: "#1f4b3b" }} />
                      ) : (
                        <>
                          <AddPhotoAlternateRoundedIcon sx={{ color: "#5f9e84", fontSize: 28 }} />
                          <Typography variant="caption" sx={{ color: "#5f9e84", fontSize: "0.62rem", fontWeight: 700 }}>
                            Agregar
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                  JPG, PNG o WEBP · Máx. 10 MB · La primera foto aparece como imagen de perfil
                </Typography>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => void handleImagePick(e)}
                />
              </Box>

              {/* Main fields */}
              <Box
                sx={{
                  mt: 2.5,
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                <TextField
                  label="Nombre del local"
                  size="small"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  inputProps={{ maxLength: 120 }}
                />
                <FormControl size="small" fullWidth>
                  <InputLabel id="profile-cat-label">Categoría</InputLabel>
                  <Select
                    labelId="profile-cat-label"
                    label="Categoría"
                    value={form.fk_category ? String(form.fk_category) : ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        fk_category: Number(e.target.value),
                      }))
                    }
                  >
                    {categories.map((c) => (
                      <MenuItem
                        key={c.id_category}
                        value={String(c.id_category)}
                      >
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="Dirección"
                  size="small"
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  inputProps={{ maxLength: 200 }}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                  <TextField
                    label="Coordenadas GPS (lat,lng)"
                    size="small"
                    placeholder="Déjá vacío para geocodificar automáticamente"
                    value={form.location ?? ""}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, location: e.target.value }))
                    }
                    helperText="Opcional · se geocodifica al guardar si está vacío"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            title="Seleccionar en mapa"
                            onClick={() => setMapOpen(true)}
                            sx={{ color: "#1f4b3b" }}
                          >
                            <MapRoundedIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                  <ProfileMapPicker
                    open={mapOpen}
                    initialLocation={form.location ?? ""}
                    onClose={() => setMapOpen(false)}
                    onConfirm={({ location, address }) => {
                      setForm((p) => ({
                        ...p,
                        location,
                        address: address || p.address,
                      }));
                      setMapOpen(false);
                    }}
                  />
                </Box>
                <TextField
                  label="Descripción"
                  size="small"
                  multiline
                  minRows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                  inputProps={{ maxLength: 800 }}
                  sx={{ gridColumn: { xs: "1", md: "1 / span 2" } }}
                />
              </Box>

              {/* Schedule */}
              <Typography
                variant="subtitle2"
                sx={{ mt: 2.5, mb: 1.2, color: "#173a2d" }}
              >
                Horarios
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                }}
              >
                <TextField
                  label="Lunes a Viernes"
                  size="small"
                  placeholder="ej: 9:00 - 18:00"
                  value={form.schedule_week ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, schedule_week: e.target.value }))
                  }
                />
                <TextField
                  label="Sábados"
                  size="small"
                  placeholder="ej: 9:00 - 13:00"
                  value={form.schedule_weekend ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      schedule_weekend: e.target.value,
                    }))
                  }
                />
                <TextField
                  label="Domingos"
                  size="small"
                  placeholder="ej: Cerrado"
                  value={form.schedule_sunday ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, schedule_sunday: e.target.value }))
                  }
                />
              </Box>

              {/* Social media */}
              <Typography
                variant="subtitle2"
                sx={{ mt: 2.5, mb: 1.2, color: "#173a2d" }}
              >
                Redes sociales
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                <TextField
                  label="Sitio web"
                  size="small"
                  placeholder="https://www.misitioweb.com"
                  value={form.social_web ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, social_web: e.target.value || null }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <span style={{ fontSize: 16 }}>🌐</span>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Instagram"
                  size="small"
                  placeholder="@tu_usuario"
                  value={form.social_instagram ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, social_instagram: e.target.value || null }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <span style={{ fontSize: 16 }}>📸</span>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Twitter / X"
                  size="small"
                  placeholder="@tu_usuario"
                  value={form.social_twitter ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, social_twitter: e.target.value || null }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <span style={{ fontSize: 16 }}>𝕏</span>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="WhatsApp"
                  size="small"
                  placeholder="+54 9 11 1234-5678"
                  value={form.social_whatsapp ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, social_whatsapp: e.target.value || null }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <span style={{ fontSize: 16 }}>💬</span>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#1f4b3b",
                    "&:hover": { bgcolor: "#173a2d" },
                  }}
                  onClick={() => void handleSave()}
                  disabled={saving}
                  startIcon={
                    saving ? (
                      <CircularProgress size={16} sx={{ color: "#fff" }} />
                    ) : undefined
                  }
                >
                  {saving ? "Guardando…" : "Guardar cambios"}
                </Button>
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

// ─── Support / Messaging section ─────────────────────────────────────────────

type SupportMessage = {
  id_message: number;
  fk_ticket?: number;
  sender_role: string;
  sender_name: string;
  body: string;
  created_at: string;
};

type SupportTicket = {
  id_ticket: number;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
};

function StoreSupportSection() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTicket = tickets.find((t) => t.id_ticket === selectedId) ?? null;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingTickets(true);
      try {
        const res = await fetch("/api/messages/conversations", { cache: "no-store" });
        const json = (await res.json().catch(() => ({}))) as { tickets?: SupportTicket[] };
        if (!cancelled) setTickets(json.tickets ?? []);
      } catch {
        // ignore network errors silently
      } finally {
        if (!cancelled) setLoadingTickets(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate() {
    if (!newSubject.trim() || !newMessage.trim()) {
      setError("Completá el asunto y el mensaje.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: newSubject, message: newMessage }),
      });
      const json = (await res.json().catch(() => ({}))) as { ticketId?: number; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Error al enviar");
        return;
      }
      const now = new Date().toISOString();
      const newTicket: SupportTicket = {
        id_ticket: json.ticketId!,
        subject: newSubject,
        status: "open",
        created_at: now,
        updated_at: now,
        messages: [
          { id_message: Date.now(), sender_role: "user", sender_name: "Vos", body: newMessage, created_at: now },
        ],
      };
      setTickets((prev) => [newTicket, ...prev]);
      setSelectedId(json.ticketId!);
      setNewSubject("");
      setNewMessage("");
      setShowNewForm(false);
    } catch {
      setError("Error de red");
    } finally {
      setSending(false);
    }
  }

  async function handleReply() {
    if (!selectedId || !replyText.trim()) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: selectedId, message: replyText }),
      });
      const json = (await res.json().catch(() => ({}))) as { ticketId?: number; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Error al enviar");
        return;
      }
      const now = new Date().toISOString();
      setTickets((prev) =>
        prev.map((t) =>
          t.id_ticket === selectedId
            ? {
                ...t,
                status: "open",
                updated_at: now,
                messages: [
                  ...t.messages,
                  { id_message: Date.now(), sender_role: "user", sender_name: "Vos", body: replyText, created_at: now },
                ],
              }
            : t,
        ),
      );
      setReplyText("");
    } catch {
      setError("Error de red");
    } finally {
      setSending(false);
    }
  }

  function statusChip(status: string) {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      open: { label: "Abierto", color: "#92400e", bg: "#fef3c7" },
      answered: { label: "Respondido", color: "#1e40af", bg: "#dbeafe" },
      closed: { label: "Cerrado", color: "#374151", bg: "#f3f4f6" },
    };
    const s = map[status] ?? { label: status, color: "#374151", bg: "#f3f4f6" };
    return (
      <Chip
        label={s.label}
        size="small"
        sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: "0.7rem", height: 20 }}
      />
    );
  }

  function timeAgoSupport(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)}d`;
  }

  return (
    <Stack spacing={2}>
      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
            <Box>
              <Typography variant="h6" color="#173a2d">
                Mensajes con el equipo de Guander
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.3 }}>
                Consultá dudas, reportá problemas o pedí asistencia. El equipo responde a la brevedad.
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={() => { setShowNewForm(true); setSelectedId(null); }}
              sx={{ bgcolor: "#1f4b3b", "&:hover": { bgcolor: "#173a2d" }, flexShrink: 0 }}
            >
              + Nueva consulta
            </Button>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

          {showNewForm && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: "#d6e4da", bgcolor: "#f8fcf9", mb: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" color="#173a2d" sx={{ mb: 1.5, fontWeight: 700 }}>
                Nueva consulta
              </Typography>
              <Stack spacing={1.5}>
                <TextField
                  label="Asunto"
                  size="small"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  inputProps={{ maxLength: 200 }}
                  placeholder="Ej: Problema con mi suscripción..."
                />
                <TextField
                  label="Mensaje"
                  size="small"
                  multiline
                  minRows={3}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  inputProps={{ maxLength: 2000 }}
                  placeholder="Describí tu consulta con el mayor detalle posible..."
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setShowNewForm(false)}
                    disabled={sending}
                    sx={{ color: "#5a7368", borderColor: "#d6e4da" }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => void handleCreate()}
                    disabled={sending}
                    startIcon={sending ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : undefined}
                    sx={{ bgcolor: "#1f4b3b" }}
                  >
                    {sending ? "Enviando..." : "Enviar consulta"}
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          )}

          {loadingTickets ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress size={28} sx={{ color: "#1f4b3b" }} />
            </Stack>
          ) : tickets.length === 0 ? (
            <Typography variant="body2" sx={{ py: 3, textAlign: "center", color: "#5a7368" }}>
              Aún no hay conversaciones. Iniciá una nueva consulta arriba.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {tickets.map((ticket) => {
                const lastMsg = ticket.messages[ticket.messages.length - 1];
                const isSelected = ticket.id_ticket === selectedId;
                return (
                  <Paper
                    key={ticket.id_ticket}
                    variant="outlined"
                    onClick={() => setSelectedId(isSelected ? null : ticket.id_ticket)}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      cursor: "pointer",
                      borderColor: isSelected ? "#1f4b3b" : "#e0ece4",
                      bgcolor: isSelected ? "#f0f7f3" : "#f8fcf9",
                      "&:hover": { borderColor: "#1f4b3b", bgcolor: "#f0f7f3" },
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.4 }}>
                          <Typography variant="body2" fontWeight={700} color="#173a2d">
                            {ticket.subject}
                          </Typography>
                          {statusChip(ticket.status)}
                        </Stack>
                        {lastMsg && (
                          <Typography variant="caption" sx={{ color: "#5a7368", display: "block" }}>
                            {lastMsg.sender_role === "admin" ? "✓ Soporte: " : "Vos: "}
                            {lastMsg.body.length > 80 ? `${lastMsg.body.slice(0, 80)}…` : lastMsg.body}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{ color: "#8caa9c", ml: 1, flexShrink: 0 }}>
                        {timeAgoSupport(ticket.updated_at)}
                      </Typography>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      {selectedTicket && (
        <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Avatar sx={{ bgcolor: "#1f4b3b", color: "#fff", width: 34, height: 34, fontWeight: 700, fontSize: 16 }}>
                G
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={700} color="#173a2d">
                  {selectedTicket.subject}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  {statusChip(selectedTicket.status)}
                  <Typography variant="caption" sx={{ color: "#5a7368" }}>
                    {timeAgoSupport(selectedTicket.created_at)}
                  </Typography>
                </Stack>
              </Box>
            </Stack>

            <Stack spacing={1.2} sx={{ mb: 2 }}>
              {selectedTicket.messages.map((msg) => (
                <Box
                  key={msg.id_message}
                  sx={{ display: "flex", justifyContent: msg.sender_role === "admin" ? "flex-end" : "flex-start" }}
                >
                  <Paper
                    sx={{
                      maxWidth: "75%",
                      p: 1.5,
                      borderRadius: 2.5,
                      ...(msg.sender_role === "admin"
                        ? { bgcolor: "#1f4b3b", color: "#fff" }
                        : { bgcolor: "#f3f9f5", border: "1px solid #dce9e0" }),
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mb: 0.4,
                        fontWeight: 700,
                        color: msg.sender_role === "admin" ? "rgba(255,255,255,0.65)" : "#5a7368",
                      }}
                    >
                      {msg.sender_role === "admin" ? "Soporte Guander" : "Vos"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        whiteSpace: "pre-wrap",
                        color: msg.sender_role === "admin" ? "#fff" : "#173a2d",
                      }}
                    >
                      {msg.body}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        display: "block",
                        mt: 0.6,
                        color: msg.sender_role === "admin" ? "rgba(255,255,255,0.5)" : "#8caa9c",
                      }}
                    >
                      {timeAgoSupport(msg.created_at)}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Stack>

            {selectedTicket.status !== "closed" ? (
              <Box>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Responder..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  inputProps={{ maxLength: 2000 }}
                />
                <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={() => void handleReply()}
                    disabled={sending || !replyText.trim()}
                    startIcon={sending ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : undefined}
                    sx={{ bgcolor: "#1f4b3b" }}
                  >
                    {sending ? "Enviando..." : "Enviar"}
                  </Button>
                </Stack>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ textAlign: "center", color: "#5a7368" }}>
                Este ticket fue cerrado por el equipo de soporte.
              </Typography>
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
      return "Mis Cupones";
    case "cupones":
      return "Generar Consumo";
    case "reseñas":
      return "Reseñas";
    case "notificaciones":
      return "Notificaciones";
    case "perfil":
      return "Mi Perfil";
    case "soporte":
      return "Soporte / Mensajes";
    default:
      return "Dashboard";
  }
}

function renderSection(section: DashboardSection, data: DashboardData, userRole?: string) {
  switch (section) {
    case "dashboard":
      return <DashboardOverview data={data} userRole={userRole} />;
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
    case "perfil":
      return <StoreProfileSection data={data} />;
    case "soporte":
      return <StoreSupportSection />;
    default:
      return <DashboardOverview data={data} />;
  }
}

function SidebarContent({
  selected,
  onSelect,
  userRole,
}: {
  selected: DashboardSection;
  onSelect: (value: DashboardSection) => void;
  userRole?: string;
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
          {userRole === "professional" ? "GUANDER PROFESIONAL" : "GUANDER LOCAL"}
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

export default function LocalDashboardClient({ data, error, userRole }: { data: DashboardData | null; error: string | null; userRole?: string }) {
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
              userRole={userRole}
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
            <SidebarContent selected={selectedSection} onSelect={setSelectedSection} userRole={userRole} />
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

          {renderSection(selectedSection, data, userRole)}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

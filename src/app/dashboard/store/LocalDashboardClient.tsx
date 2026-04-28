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
import SearchIcon from "@mui/icons-material/Search";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
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
  | "notificaciones"
  | "perfil";

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

// ─── Store profile editor ─────────────────────────────────────────────────────

type CategoryOption = { id_category: number; name: string };

type ProfileStore = {
  name: string;
  description: string;
  address: string;
  location: string;
  image_url: string | null;
  fk_category: number;
  schedule_week: string | null;
  schedule_weekend: string | null;
  schedule_sunday: string | null;
};

function StoreProfileSection({ data }: { data: DashboardData }) {
  const [form, setForm] = useState<ProfileStore>({
    name: data.store.name,
    description: data.store.description,
    address: data.store.address,
    location: data.store.location,
    image_url: null,
    fk_category: 0,
    schedule_week: "",
    schedule_weekend: "",
    schedule_sunday: "",
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
          setForm({
            name: s.name ?? data.store.name,
            description: s.description ?? data.store.description,
            address: s.address ?? data.store.address,
            location: s.location ?? data.store.location,
            image_url: s.image_url ?? null,
            fk_category: s.fk_category ?? 0,
            schedule_week: s.schedule_week ?? "",
            schedule_weekend: s.schedule_weekend ?? "",
            schedule_sunday: s.schedule_sunday ?? "",
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
        setForm((prev) => ({ ...prev, image_url: json.url! }));
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
        body: JSON.stringify(form),
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

              {/* Photo */}
              <Box
                sx={{ mt: 2.5, display: "flex", alignItems: "center", gap: 2 }}
              >
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: 3,
                    border: "1px solid #d6e4da",
                    overflow: "hidden",
                    bgcolor: "#f3f9f5",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {form.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={form.image_url}
                      alt="Foto del local"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <StorefrontRoundedIcon
                      sx={{ color: "#8cb8a4", fontSize: 40 }}
                    />
                  )}
                </Box>
                <Stack spacing={0.5}>
                  <Typography variant="body2" fontWeight={700} color="#173a2d">
                    Foto del local
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG o WEBP · Máx. 10 MB
                  </Typography>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: "none" }}
                    onChange={(e) => void handleImagePick(e)}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={uploading}
                    startIcon={
                      uploading ? (
                        <CircularProgress
                          size={14}
                          sx={{ color: "#1f4b3b" }}
                        />
                      ) : undefined
                    }
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      alignSelf: "flex-start",
                      borderColor: "#1f4b3b",
                      color: "#1f4b3b",
                      mt: 0.4,
                    }}
                  >
                    {uploading ? "Subiendo…" : "Cambiar foto"}
                  </Button>
                </Stack>
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
                <TextField
                  label="Coordenadas GPS (lat,lng)"
                  size="small"
                  placeholder="Déjá vacío para geocodificar automáticamente"
                  value={form.location ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, location: e.target.value }))
                  }
                  helperText="Opcional · se geocodifica al guardar si está vacío"
                />
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

          {renderSection(selectedSection, data, userRole)}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

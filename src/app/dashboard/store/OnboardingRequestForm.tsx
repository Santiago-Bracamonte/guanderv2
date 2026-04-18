"use client";

import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import Link from "next/link";

interface Category {
  id_category: number;
  name: string;
}

const SCHEDULE_PRESETS = [
  "Cerrado",
  "09:00-18:00",
  "08:00-20:00",
  "08:00-21:00",
  "10:00-20:00",
  "07:00-15:00",
  "24 horas",
];

export default function OnboardingRequestForm() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [existingRequest, setExistingRequest] = useState<{
    id_request: number;
    status: string;
    notes: string | null;
    created_at: string;
  } | null>(null);
  const [checkingRequest, setCheckingRequest] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ displayName: string; lat: number; lng: number }[]>([]);
  const [location, setLocation] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [cuitCuil, setCuitCuil] = useState("");
  const [matricula, setMatricula] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [scheduleWeek, setScheduleWeek] = useState("09:00-18:00");
  const [scheduleWeekend, setScheduleWeekend] = useState("09:00-15:00");
  const [scheduleSunday, setScheduleSunday] = useState("Cerrado");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Check if user already has a pending request
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/store/request-registration");
        const data = await res.json() as { success: boolean; request: typeof existingRequest };
        if (data.success && data.request) {
          setExistingRequest(data.request);
        }
      } catch {
        // ignore
      } finally {
        setCheckingRequest(false);
      }
    })();
  }, []);

  // Load categories
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/locales/categories");
        const data = await res.json() as { success: boolean; data: Category[] };
        if (data.success) setCategories(data.data);
      } catch {
        // ignore
      }
    })();
  }, []);

  // Geocode address search
  useEffect(() => {
    if (addressQuery.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/locales/geocode?q=${encodeURIComponent(addressQuery)}`);
        const data = await res.json() as { suggestions: typeof suggestions };
        setSuggestions(data.suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [addressQuery]);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", "guander_unsigned");
      fd.append("folder", "guander/locales");
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dwckkyqpw/image/upload",
        { method: "POST", body: fd },
      );
      const data = await res.json() as { secure_url?: string; error?: { message: string } };
      if (res.ok && data.secure_url) {
        setImageUrl(data.secure_url);
      } else {
        setErrorMsg(data.error?.message ?? "Error al subir imagen");
      }
    } catch {
      setErrorMsg("Error al subir imagen");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!businessName.trim()) {
      setErrorMsg("El nombre del local es requerido");
      return;
    }
    if (!address.trim()) {
      setErrorMsg("La dirección es requerida");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/store/request-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName,
          description,
          address,
          location,
          fk_category: categoryId !== "" ? categoryId : undefined,
          cuit_cuil: cuitCuil,
          matricula,
          razon_social: razonSocial,
          schedule_week: scheduleWeek,
          schedule_weekend: scheduleWeekend,
          schedule_sunday: scheduleSunday,
          image_url: imageUrl || undefined,
        }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok) {
        setErrorMsg(data.error ?? "Error al enviar la solicitud");
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg("Error de conexión");
      setStatus("error");
    }
  }

  if (checkingRequest) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === "success" || existingRequest) {
    const req = existingRequest;
    const isPending = !status || req?.status === "pending";
    const isRejected = req?.status === "rejected";
    return (
      <Box sx={{ maxWidth: 640, mx: "auto", mt: 6, px: 2 }}>
        <Paper
          elevation={0}
          sx={{ p: 4, border: "1px solid #d6e4da", borderRadius: 3, textAlign: "center" }}
        >
          {isRejected ? (
            <>
              <Typography variant="h5" fontWeight={800} color="#9b2020" mb={1}>
                Solicitud rechazada
              </Typography>
              {req?.notes && (
                <Alert severity="error" sx={{ mb: 2, textAlign: "left" }}>
                  {req.notes}
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary">
                Podés volver a enviar una nueva solicitud corregida.
              </Typography>
              <Button
                variant="contained"
                sx={{ mt: 3 }}
                onClick={() => setExistingRequest(null)}
              >
                Enviar nueva solicitud
              </Button>
            </>
          ) : (
            <>
              {isPending && status !== "success" ? (
                <HourglassTopRoundedIcon sx={{ fontSize: 56, color: "#1f4b3b", mb: 2 }} />
              ) : (
                <CheckCircleRoundedIcon sx={{ fontSize: 56, color: "#2e7d5b", mb: 2 }} />
              )}
              <Typography variant="h5" fontWeight={800} color="#173a2d" mb={1}>
                {status === "success" && !req
                  ? "¡Solicitud enviada!"
                  : isPending
                    ? "Solicitud en revisión"
                    : "Solicitud aprobada"}
              </Typography>
              <Typography variant="body2" color="#4b675b">
                {status === "success" && !req
                  ? "Un administrador revisará tus datos y creará tu local. Te avisaremos por email."
                  : isPending
                    ? "Tu solicitud está siendo revisada por el equipo de Guander."
                    : "Tu local fue creado. Actualizá la página para verlo."}
              </Typography>
              {(status === "success" && !req) || isPending ? (
                <Button
                  component={Link}
                  href="/"
                  variant="outlined"
                  sx={{ mt: 3, borderColor: "#2e7d5b", color: "#2e7d5b", "&:hover": { borderColor: "#1f4b3b", color: "#1f4b3b" } }}
                >
                  Volver al inicio
                </Button>
              ) : null}
              {req?.created_at && (
                <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                  Enviada el{" "}
                  {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
                    new Date(req.created_at),
                  )}
                </Typography>
              )}
              {req?.status === "approved" && (
                <Button
                  variant="contained"
                  sx={{ mt: 3 }}
                  onClick={() => window.location.reload()}
                >
                  Recargar dashboard
                </Button>
              )}
            </>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: "auto", mt: 4, px: 2, pb: 6 }}>
      <Typography variant="h5" fontWeight={800} color="#173a2d" mb={0.5}>
        Solicitar alta de local / profesional
      </Typography>
      <Typography variant="body2" color="#4b675b" mb={3}>
        Completá el formulario con tus datos para que el equipo de Guander cree tu perfil en la
        plataforma. Te avisaremos por email cuando esté listo.
      </Typography>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Datos del negocio */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #d6e4da", borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#1f4b3b" mb={2}>
              Datos del local / profesional
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Nombre *"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                fullWidth
                inputProps={{ maxLength: 120 }}
              />
              <TextField
                label="Descripción"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
                inputProps={{ maxLength: 500 }}
              />
              <Box sx={{ position: "relative" }}>
                <TextField
                  label="Dirección *"
                  value={addressQuery}
                  onChange={(e) => {
                    setAddressQuery(e.target.value);
                    setAddress(e.target.value);
                    setLocation("");
                  }}
                  fullWidth
                  placeholder="Buscá y seleccioná la dirección exacta"
                  inputProps={{ maxLength: 300 }}
                />
                {suggestions.length > 0 && (
                  <Paper
                    elevation={4}
                    sx={{
                      position: "absolute",
                      zIndex: 1200,
                      width: "100%",
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    {suggestions.map((s, i) => (
                      <Box
                        key={i}
                        sx={{
                          px: 2,
                          py: 1.2,
                          cursor: "pointer",
                          fontSize: 13,
                          "&:hover": { bgcolor: "#f0f7f2" },
                          borderBottom: "1px solid #eee",
                        }}
                        onClick={() => {
                          setAddress(s.displayName);
                          setAddressQuery(s.displayName);
                          setLocation(`${s.lat},${s.lng}`);
                          setSuggestions([]);
                        }}
                      >
                        {s.displayName}
                      </Box>
                    ))}
                  </Paper>
                )}
              </Box>
              {location && (
                <Typography variant="caption" color="#2e7d5b">
                  📍 Coordenadas: {location}
                </Typography>
              )}
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={categoryId}
                  label="Categoría"
                  onChange={(e) => setCategoryId(e.target.value as number)}
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id_category} value={c.id_category}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {/* Datos fiscales */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #d6e4da", borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#1f4b3b" mb={2}>
              Datos fiscales / ARCA (AFIP)
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="CUIT / CUIL"
                value={cuitCuil}
                onChange={(e) => setCuitCuil(e.target.value)}
                fullWidth
                placeholder="XX-XXXXXXXX-X"
                inputProps={{ maxLength: 15 }}
              />
              <TextField
                label="Razón social"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                fullWidth
                inputProps={{ maxLength: 200 }}
              />
              <TextField
                label="Matrícula profesional (si aplica)"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                fullWidth
                inputProps={{ maxLength: 80 }}
              />
            </Stack>
          </Paper>

          {/* Horarios */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #d6e4da", borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#1f4b3b" mb={2}>
              Horarios de atención
            </Typography>
            <Stack spacing={2}>
              {[
                { label: "Lunes a viernes", value: scheduleWeek, setter: setScheduleWeek },
                { label: "Sábados", value: scheduleWeekend, setter: setScheduleWeekend },
                { label: "Domingos", value: scheduleSunday, setter: setScheduleSunday },
              ].map(({ label, value, setter }) => (
                <Stack key={label} direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}>
                  <Typography variant="body2" sx={{ minWidth: 160, color: "#4b675b" }}>
                    {label}
                  </Typography>
                  <FormControl fullWidth size="small">
                    <InputLabel>{label}</InputLabel>
                    <Select
                      value={SCHEDULE_PRESETS.includes(value) ? value : "personalizado"}
                      label={label}
                      onChange={(e) => {
                        if (e.target.value !== "personalizado") setter(e.target.value);
                      }}
                    >
                      {SCHEDULE_PRESETS.map((p) => (
                        <MenuItem key={p} value={p}>
                          {p}
                        </MenuItem>
                      ))}
                      {!SCHEDULE_PRESETS.includes(value) && (
                        <MenuItem value="personalizado">Personalizado</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  <TextField
                    size="small"
                    label="O ingresá horario"
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    sx={{ minWidth: 160 }}
                    placeholder="ej: 09:00-18:00"
                    inputProps={{ maxLength: 30 }}
                  />
                </Stack>
              ))}
            </Stack>
          </Paper>

          {/* Imagen */}
          <Paper elevation={0} sx={{ p: 3, border: "1px solid #d6e4da", borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#1f4b3b" mb={2}>
              Imagen del local
            </Typography>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
            <Box
              onClick={() => fileRef.current?.click()}
              sx={{
                border: "2px dashed #a5c4ad",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                bgcolor: "#f4faf6",
                "&:hover": { bgcolor: "#eaf4ee" },
              }}
            >
              {uploadingImage ? (
                <CircularProgress size={32} />
              ) : imageUrl ? (
                <Box
                  component="img"
                  src={imageUrl}
                  alt="Preview"
                  sx={{ maxHeight: 160, borderRadius: 2, objectFit: "cover" }}
                />
              ) : (
                <>
                  <ImageRoundedIcon sx={{ fontSize: 40, color: "#7aab8a", mb: 1 }} />
                  <Typography variant="body2" color="#4b675b">
                    Click para subir imagen
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    JPG, PNG, WEBP — máx 10MB
                  </Typography>
                </>
              )}
            </Box>
            {imageUrl && (
              <Button
                size="small"
                color="error"
                onClick={() => setImageUrl("")}
                sx={{ mt: 1 }}
              >
                Eliminar imagen
              </Button>
            )}
          </Paper>

          {errorMsg && (
            <Alert severity="error">{errorMsg}</Alert>
          )}

          <Divider />

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={status === "loading"}
            startIcon={
              status === "loading" ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon />
            }
            sx={{
              bgcolor: "#1f4b3b",
              "&:hover": { bgcolor: "#173a2d" },
              borderRadius: 3,
              py: 1.5,
              fontWeight: 700,
            }}
          >
            {status === "loading" ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </Stack>
      </form>
    </Box>
  );
}

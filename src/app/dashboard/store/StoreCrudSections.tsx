"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Chip,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { BenefitRow, CouponRow, ServiceRow } from "./types";

type ServiceItem = ServiceRow & {
  description: string;
  address: string;
  location: string;
  fk_type_service: number;
  fk_schedule: number;
};

type ServiceTypeOption = {
  id_type_service: number;
  name: string;
};

type ScheduleOption = {
  id_schedule: number;
  week: string;
  weekend: string;
  sunday: string;
};

type CouponServiceOption = {
  id_professional: number;
  service_name: string;
  accept_point: number;
};

type ConsumptionFormItem = {
  idProfessional: number;
  serviceName: string;
  quantity: number;
  unitAmount: number;
  acceptPoint: boolean;
};

function money(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

function when(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" }).format(date);
}

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

function DeleteConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function StoreServicesCrudSection({ initialItems }: { initialItems: ServiceRow[] }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState<ServiceItem[]>(
    initialItems.map((item) => ({
      ...item,
      description: "",
      address: "",
      location: "",
      fk_type_service: 0,
      fk_schedule: 0,
    })),
  );
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [schedules, setSchedules] = useState<ScheduleOption[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteService, setPendingDeleteService] = useState<ServiceItem | null>(null);

  const [form, setForm] = useState({
    description: "",
    address: "",
    location: "",
    typeServiceId: "",
    scheduleId: "",
    acceptPoint: true,
  });

  async function loadServices() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/store/services", { cache: "no-store" });
      const json = await readJson<{
        success?: boolean;
        error?: string;
        data?: {
          services: ServiceItem[];
          serviceTypes: ServiceTypeOption[];
          schedules: ScheduleOption[];
        };
      }>(res);

      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "No se pudieron cargar los servicios");
      }

      setServices(json.data.services);
      setServiceTypes(json.data.serviceTypes);
      setSchedules(json.data.schedules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar servicios");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  function resetForm() {
    setForm({
      description: "",
      address: "",
      location: "",
      typeServiceId: "",
      scheduleId: "",
      acceptPoint: true,
    });
    setEditingId(null);
  }

  async function handleSubmit() {
    setError("");
    const payload = {
      description: form.description,
      address: form.address,
      location: form.location,
      typeServiceId: Number(form.typeServiceId),
      scheduleId: Number(form.scheduleId),
      acceptPoint: form.acceptPoint,
      idProfessional: editingId ?? undefined,
    };

    const method = editingId ? "PUT" : "POST";

    const res = await fetch("/api/store/services", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(json.error ?? "No se pudo guardar el servicio");
      return;
    }

    resetForm();
    await loadServices();
  }

  async function handleDelete(idProfessional: number) {
    setError("");
    const res = await fetch(`/api/store/services?idProfessional=${idProfessional}`, {
      method: "DELETE",
    });
    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(json.error ?? "No se pudo eliminar el servicio");
      return;
    }
    await loadServices();
  }

  function startEdit(service: ServiceItem) {
    setEditingId(service.id_professional);
    setForm({
      description: service.description,
      address: service.address,
      location: service.location,
      typeServiceId: String(service.fk_type_service),
      scheduleId: String(service.fk_schedule),
      acceptPoint: service.accept_point === 1,
    });
  }

  return (
    <Stack spacing={2}>
      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Typography variant="h6" color="#173a2d">
            Mis Servicios
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Crea, edita y elimina servicios asociados a tu local.
          </Typography>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Box sx={{ mt: 2, display: "grid", gap: 1.2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            <TextField
              label="Descripcion"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Direccion"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              fullWidth
              size="small"
            />
            <TextField
              label="Ubicacion"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              fullWidth
              size="small"
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="service-type-label">Tipo de servicio</InputLabel>
              <Select
                labelId="service-type-label"
                value={form.typeServiceId}
                label="Tipo de servicio"
                onChange={(e) => setForm((prev) => ({ ...prev, typeServiceId: e.target.value }))}
              >
                {serviceTypes.map((type) => (
                  <MenuItem key={type.id_type_service} value={String(type.id_type_service)}>
                    {type.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel id="schedule-label">Horario</InputLabel>
              <Select
                labelId="schedule-label"
                value={form.scheduleId}
                label="Horario"
                onChange={(e) => setForm((prev) => ({ ...prev, scheduleId: e.target.value }))}
              >
                {schedules.map((schedule) => (
                  <MenuItem key={schedule.id_schedule} value={String(schedule.id_schedule)}>
                    {`Semana: ${schedule.week} | Sabado: ${schedule.weekend}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={form.acceptPoint}
                  onChange={(e) => setForm((prev) => ({ ...prev, acceptPoint: e.target.checked }))}
                />
              }
              label="Acepta puntos"
            />
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 1.8 }}>
            <Button variant="contained" sx={{ bgcolor: "#1f4b3b" }} onClick={() => void handleSubmit()}>
              {editingId ? "Actualizar servicio" : "Crear servicio"}
            </Button>
            {editingId && (
              <Button variant="outlined" onClick={resetForm}>
                Cancelar edicion
              </Button>
            )}
          </Stack>

          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Servicio</TableCell>
                <TableCell>Descripcion</TableCell>
                <TableCell align="center">Acepta puntos</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>Aun no tienes servicios.</TableCell>
                </TableRow>
              )}
              {services.map((service) => (
                <TableRow key={service.id_professional}>
                  <TableCell>{service.service_name}</TableCell>
                  <TableCell>{service.description}</TableCell>
                  <TableCell align="center">{service.accept_point === 1 ? "Si" : "No"}</TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button size="small" variant="outlined" onClick={() => startEdit(service)}>
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => setPendingDeleteService(service)}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <DeleteConfirmDialog
            open={Boolean(pendingDeleteService)}
            title="Eliminar servicio"
            description={`Vas a eliminar el servicio ${pendingDeleteService?.service_name ?? ""}. Esta accion no se puede deshacer.`}
            onCancel={() => setPendingDeleteService(null)}
            onConfirm={() => {
              if (pendingDeleteService) {
                void handleDelete(pendingDeleteService.id_professional);
              }
              setPendingDeleteService(null);
            }}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}

// ─── Coupon management (coupon_store) ────────────────────────────────────────

type ManagedCoupon = {
  id_coupon: number;
  name: string;
  description: string;
  expiration_date: string;
  point_req: number;
  code_coupon: string;
  amount: number;
  fk_coupon_state: number;
  state: number;
  coupon_state_name: string | null;
  redemptions: number;
};

type CouponStateOption = { id_coupon_state: number; name: string };

const emptyCouponForm = () => ({
  name: "",
  description: "",
  amount: "",
  expirationDate: "",
  pointReq: "0",
  enabled: true,
});

export function StoreCouponManagementSection() {
  const [coupons, setCoupons] = useState<ManagedCoupon[]>([]);
  const [couponStates, setCouponStates] = useState<CouponStateOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ManagedCoupon | null>(null);
  const [form, setForm] = useState(emptyCouponForm());

  async function loadCoupons() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/store/coupons", { cache: "no-store" });
      const json = await readJson<{
        success?: boolean;
        data?: { coupons: ManagedCoupon[]; couponStates: CouponStateOption[] };
        error?: string;
      }>(res);
      if (!res.ok || !json.data) throw new Error(json.error ?? "Error al cargar cupones");
      setCoupons(json.data.coupons);
      setCouponStates(json.data.couponStates);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar cupones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCoupons();
  }, []);

  function resetForm() {
    setForm(emptyCouponForm());
    setEditingId(null);
    setError("");
  }

  async function handleSubmit() {
    setError("");
    const amount = Number(form.amount);
    if (!form.name.trim()) { setError("El nombre es obligatorio"); return; }
    if (!form.description.trim()) { setError("La descripcion es obligatoria"); return; }
    if (!form.expirationDate) { setError("La fecha de vencimiento es obligatoria"); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setError("El monto de descuento debe ser mayor a 0"); return; }

    setSaving(true);
    try {
      if (editingId) {
        const editing = coupons.find((c) => c.id_coupon === editingId);
        const payload = {
          idCoupon: editingId,
          name: form.name.trim(),
          description: form.description.trim(),
          amount,
          expirationDate: form.expirationDate,
          pointReq: Number(form.pointReq) || 0,
          enabled: form.enabled,
          couponStateId: editing?.fk_coupon_state ?? couponStates[0]?.id_coupon_state,
        };
        const res = await fetch("/api/store/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await readJson<{ error?: string }>(res);
        if (!res.ok) throw new Error(json.error ?? "No se pudo actualizar el cupon");
      } else {
        const payload = {
          name: form.name.trim(),
          description: form.description.trim(),
          amount,
          expirationDate: form.expirationDate,
          pointReq: Number(form.pointReq) || 0,
          enabled: form.enabled,
        };
        const res = await fetch("/api/store/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await readJson<{ error?: string }>(res);
        if (!res.ok) throw new Error(json.error ?? "No se pudo crear el cupon");
      }
      resetForm();
      await loadCoupons();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el cupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(idCoupon: number) {
    const res = await fetch(`/api/store/coupons?idCoupon=${idCoupon}`, { method: "DELETE" });
    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) { setError(json.error ?? "No se pudo eliminar el cupon"); return; }
    await loadCoupons();
  }

  function startEdit(c: ManagedCoupon) {
    setEditingId(c.id_coupon);
    setForm({
      name: c.name,
      description: c.description,
      amount: String(c.amount),
      expirationDate: c.expiration_date.slice(0, 10),
      pointReq: String(c.point_req),
      enabled: c.state === 1,
    });
    setError("");
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
      <CardContent>
        <Typography variant="h6" color="#173a2d">
          Mis Cupones
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Creá cupones de descuento para tus clientes. Los cupones activos aparecerán
          disponibles al generar un consumo.
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}

        {/* Form */}
        <Box
          sx={{
            mt: 2,
            display: "grid",
            gap: 1.2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0,1fr))" },
          }}
        >
          <TextField
            size="small"
            label="Nombre del cupón"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            inputProps={{ maxLength: 120 }}
          />
          <TextField
            size="small"
            label="Monto de descuento"
            type="number"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            inputProps={{ min: 1, step: 0.01 }}
          />
          <TextField
            size="small"
            label="Vencimiento"
            type="date"
            value={form.expirationDate}
            onChange={(e) => setForm((p) => ({ ...p, expirationDate: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            size="small"
            label="Puntos requeridos (0 = sin requisito)"
            type="number"
            value={form.pointReq}
            onChange={(e) => setForm((p) => ({ ...p, pointReq: e.target.value }))}
            inputProps={{ min: 0, step: 1 }}
          />
          <TextField
            size="small"
            label="Descripción"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            inputProps={{ maxLength: 350 }}
            sx={{ gridColumn: { xs: "1", md: "1 / span 2" } }}
          />
        </Box>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.4 }}>
          <FormControlLabel
            control={
              <Switch
                checked={form.enabled}
                onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))}
                size="small"
                sx={{ "& .MuiSwitch-thumb": { bgcolor: form.enabled ? "#1f4b3b" : undefined } }}
              />
            }
            label={<Typography variant="body2">{form.enabled ? "Activo" : "Inactivo"}</Typography>}
          />
          <Button
            variant="contained"
            sx={{ bgcolor: "#1f4b3b", "&:hover": { bgcolor: "#173a2d" } }}
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            {saving ? "Guardando…" : editingId ? "Actualizar cupón" : "Crear cupón"}
          </Button>
          {editingId && (
            <Button variant="outlined" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </Stack>

        {/* Table */}
        {loading ? (
          <Stack alignItems="center" sx={{ mt: 3 }}>
            <CircularProgress size={24} sx={{ color: "#1f4b3b" }} />
          </Stack>
        ) : (
          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Descuento</TableCell>
                <TableCell>Vencimiento</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Código</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>Aún no tenés cupones creados.</TableCell>
                </TableRow>
              )}
              {coupons.map((c) => (
                <TableRow key={c.id_coupon}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{money(c.amount)}</TableCell>
                  <TableCell>{c.expiration_date.slice(0, 10)}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.state === 1 ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        bgcolor: c.state === 1 ? "#d4edda" : "#f8d7da",
                        color: c.state === 1 ? "#155724" : "#721c24",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 12 }}>
                    {c.code_coupon}
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.8} justifyContent="center">
                      <Button size="small" variant="outlined" onClick={() => startEdit(c)}>
                        Editar
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => setPendingDelete(c)}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DeleteConfirmDialog
          open={Boolean(pendingDelete)}
          title="Eliminar cupón"
          description={`Vas a eliminar el cupón "${pendingDelete?.name ?? ""}". Esta acción no se puede deshacer.`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => {
            if (pendingDelete) void handleDelete(pendingDelete.id_coupon);
            setPendingDelete(null);
          }}
        />
      </CardContent>
    </Card>
  );
}

export function StorePromotionsCrudSection({ initialItems }: { initialItems: BenefitRow[] }) {
  const [promotions, setPromotions] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeletePromotion, setPendingDeletePromotion] = useState<BenefitRow | null>(null);
  const [form, setForm] = useState({
    description: "",
    reqPoint: "0",
    percentage: "10",
  });

  async function loadPromotions() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/store/promotions", { cache: "no-store" });
      const json = await readJson<{ success?: boolean; data?: BenefitRow[]; error?: string }>(res);
      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "No se pudieron cargar promociones");
      }
      setPromotions(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar promociones");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPromotions();
  }, []);

  function resetForm() {
    setForm({ description: "", reqPoint: "0", percentage: "10" });
    setEditingId(null);
  }

  async function handleSubmit() {
    setError("");
    const payload = {
      idBenefitStore: editingId ?? undefined,
      description: form.description,
      reqPoint: Number(form.reqPoint),
      percentage: Number(form.percentage),
    };

    const res = await fetch("/api/store/promotions", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(json.error ?? "No se pudo guardar la promocion");
      return;
    }

    resetForm();
    await loadPromotions();
  }

  async function handleDelete(idBenefitStore: number) {
    const res = await fetch(`/api/store/promotions?idBenefitStore=${idBenefitStore}`, { method: "DELETE" });
    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(json.error ?? "No se pudo eliminar la promocion");
      return;
    }
    await loadPromotions();
  }

  function startEdit(item: BenefitRow) {
    setEditingId(item.id_benefit_store);
    setForm({
      description: item.description,
      reqPoint: String(item.req_point),
      percentage: String(item.percentage),
    });
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
      <CardContent>
        <Typography variant="h6" color="#173a2d">
          Mis Promociones
        </Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Gestiona beneficios para clientes de tu local.
        </Typography>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        <Box sx={{ mt: 2, display: "grid", gap: 1.2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 1fr" } }}>
          <TextField
            size="small"
            label="Descripcion"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <TextField
            size="small"
            label="Puntos requeridos"
            type="number"
            value={form.reqPoint}
            onChange={(e) => setForm((prev) => ({ ...prev, reqPoint: e.target.value }))}
          />
          <TextField
            size="small"
            label="Descuento %"
            type="number"
            value={form.percentage}
            onChange={(e) => setForm((prev) => ({ ...prev, percentage: e.target.value }))}
          />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1.8 }}>
          <Button variant="contained" sx={{ bgcolor: "#1f4b3b" }} onClick={() => void handleSubmit()}>
            {editingId ? "Actualizar promocion" : "Crear promocion"}
          </Button>
          {editingId && (
            <Button variant="outlined" onClick={resetForm}>
              Cancelar edicion
            </Button>
          )}
        </Stack>

        <Table size="small" sx={{ mt: 2 }}>
          <TableHead>
            <TableRow>
              <TableCell>Descripcion</TableCell>
              <TableCell>Puntos</TableCell>
              <TableCell>% OFF</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading && promotions.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>Aun no tienes promociones.</TableCell>
              </TableRow>
            )}
            {promotions.map((promotion) => (
              <TableRow key={promotion.id_benefit_store}>
                <TableCell>{promotion.description}</TableCell>
                <TableCell>{promotion.req_point}</TableCell>
                <TableCell>{promotion.percentage}%</TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} justifyContent="center">
                    <Button size="small" variant="outlined" onClick={() => startEdit(promotion)}>
                      Editar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => setPendingDeletePromotion(promotion)}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <DeleteConfirmDialog
          open={Boolean(pendingDeletePromotion)}
          title="Eliminar promocion"
          description={`Vas a eliminar la promocion ${pendingDeletePromotion?.description ?? ""}. Esta accion no se puede deshacer.`}
          onCancel={() => setPendingDeletePromotion(null)}
          onConfirm={() => {
            if (pendingDeletePromotion) {
              void handleDelete(pendingDeletePromotion.id_benefit_store);
            }
            setPendingDeletePromotion(null);
          }}
        />
      </CardContent>
    </Card>
  );
}

export function StoreCouponsCrudSection({ activeCoupons = [] }: { activeCoupons?: CouponRow[] }) {
  const [consumptionError, setConsumptionError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [selectedQrCode, setSelectedQrCode] = useState("");
  const [serviceOptions, setServiceOptions] = useState<CouponServiceOption[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedServiceQty, setSelectedServiceQty] = useState("1");
  const [selectedServiceAmount, setSelectedServiceAmount] = useState("");
  const [consumptionItems, setConsumptionItems] = useState<ConsumptionFormItem[]>([]);
  const [customerSummary, setCustomerSummary] = useState<{ name: string; email: string } | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponRow | null>(null);
  const [liveCoupons, setLiveCoupons] = useState<CouponRow[]>(activeCoupons);

  async function loadServiceOptions() {
    setConsumptionError("");
    const res = await fetch("/api/store/services", { cache: "no-store" });
    const json = await readJson<{
      error?: string;
      data?: {
        services: CouponServiceOption[];
      };
    }>(res);

    if (!res.ok || !json.data) {
      setConsumptionError(json.error ?? "No se pudieron cargar los servicios del local");
      return;
    }

    const deduped = Array.from(
      new Map(
        json.data.services.map((service) => [service.service_name.toLowerCase(), service]),
      ).values(),
    );
    setServiceOptions(deduped);
  }

  async function loadLiveCoupons() {
    try {
      const res = await fetch("/api/store/coupons", { cache: "no-store" });
      const json = await readJson<{
        success?: boolean;
        data?: { coupons: CouponRow[] };
        error?: string;
      }>(res);
      if (res.ok && json.data) {
        setLiveCoupons(
          json.data.coupons.filter(
            (c) => c.state === 1 && new Date(c.expiration_date) >= new Date(),
          ),
        );
      }
    } catch {
      // silently keep server-provided fallback
    }
  }

  useEffect(() => {
    void loadServiceOptions();
    void loadLiveCoupons();
  }, []);

  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return serviceOptions.find((service) => service.id_professional === Number(selectedServiceId)) ?? null;
  }, [selectedServiceId, serviceOptions]);

  const consumptionSummary = useMemo(() => {
    const subtotal = Number(
      consumptionItems.reduce((acc, item) => acc + item.quantity * item.unitAmount, 0).toFixed(2),
    );
    const pointEligibleBase = consumptionItems.reduce((acc, item) => {
      if (!item.acceptPoint) return acc;
      return acc + item.quantity * item.unitAmount;
    }, 0);
    const couponDiscount = selectedCoupon ? Math.min(selectedCoupon.amount, subtotal) : 0;
    const discountedSubtotal = Number((subtotal - couponDiscount).toFixed(2));
    // Distribute discount proportionally over point-eligible items
    const pointEligibleAfterDiscount =
      subtotal > 0
        ? Math.max(0, pointEligibleBase - couponDiscount * (pointEligibleBase / subtotal))
        : 0;
    const points = Math.floor(pointEligibleAfterDiscount / 1000);
    return { subtotal, couponDiscount, discountedSubtotal, points };
  }, [consumptionItems, selectedCoupon]);

  function addServiceToConsumption() {
    setConsumptionError("");
    if (!selectedService) {
      setConsumptionError("Debes elegir un servicio");
      return;
    }

    const quantity = Number(selectedServiceQty);
    const unitAmount = Number(selectedServiceAmount);

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setConsumptionError("La cantidad debe ser un numero entero mayor a 0");
      return;
    }

    if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
      setConsumptionError("El monto unitario debe ser mayor a 0");
      return;
    }

    if (consumptionItems.some((item) => item.idProfessional === selectedService.id_professional)) {
      setConsumptionError("Ese servicio ya fue agregado a la lista");
      return;
    }

    setConsumptionItems((prev) => [
      ...prev,
      {
        idProfessional: selectedService.id_professional,
        serviceName: selectedService.service_name,
        quantity,
        unitAmount: Number(unitAmount.toFixed(2)),
        acceptPoint: selectedService.accept_point === 1,
      },
    ]);
    setSelectedServiceId("");
    setSelectedServiceQty("1");
    setSelectedServiceAmount("");
  }

  function clearConsumptionForm() {
    setSelectedServiceId("");
    setSelectedServiceQty("1");
    setSelectedServiceAmount("");
    setConsumptionItems([]);
    setConsumptionError("");
    setCustomerSummary(null);
    setQrDataUrl("");
    setSelectedQrCode("");
    setSelectedCoupon(null);
  }

  async function generateConsumptionQr() {
    setConsumptionError("");

    if (consumptionItems.length === 0) {
      setConsumptionError("Agrega al menos un servicio antes de generar el QR");
      return;
    }

    const payload = {
      items: consumptionItems.map((item) => ({
        idProfessional: item.idProfessional,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
      })),
      ...(selectedCoupon ? { couponCode: selectedCoupon.code_coupon } : {}),
    };

    const res = await fetch("/api/store/coupons/consumption-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await readJson<{
      error?: string;
      data?: {
        consumptionCode: string;
        customerName: string;
        customerEmail: string;
        subtotal: number;
        pointsEarn: number;
        qrPayload: unknown;
      };
    }>(res);

    if (!res.ok || !json.data) {
      setConsumptionError(json.error ?? "No se pudo generar el codigo QR de consumo");
      return;
    }

    const dataUrl = await QRCode.toDataURL(JSON.stringify(json.data.qrPayload), {
      width: 220,
      margin: 1,
    });

    setSelectedQrCode(json.data.consumptionCode);
    setQrDataUrl(dataUrl);
    setCustomerSummary({
      name: json.data.customerName,
      email: json.data.customerEmail,
    });
  }

  function handleDownloadQr() {
    if (!qrDataUrl) return;
    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `${selectedQrCode || "qr-consumo"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrintQr() {
    if (!qrDataUrl) return;
    const printWindow = window.open("", "_blank", "width=420,height=520");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir QR</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; text-align: center; }
            img { width: 260px; height: 260px; }
            p { margin-top: 14px; font-size: 14px; }
          </style>
        </head>
        <body>
          <img src="${qrDataUrl}" alt="QR" />
          <p>${selectedQrCode || "Codigo QR"}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }

  return (
    <Stack spacing={2}>
      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Typography variant="h6" color="#173a2d">
            Generar Consumo
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Agrega servicios del local, define cantidades y monto por item, y genera el codigo de consumo.
          </Typography>

          {consumptionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {consumptionError}
            </Alert>
          )}

          {liveCoupons.length > 0 && (
            <Paper variant="outlined" sx={{ mt: 2, p: 1.5, borderColor: "#d6e4da", bgcolor: "#f8fcf9" }}>
              <Typography variant="caption" sx={{ color: "#173a2d", fontWeight: 700, display: "block", mb: 0.6 }}>
                Cupones de descuento del local — hacé clic para aplicar al consumo:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {liveCoupons.length === 0 ? (
                  <Typography variant="caption" sx={{ color: "#5a7368" }}>Sin cupones activos</Typography>
                ) : (
                  liveCoupons.map((coupon) => {
                    const isSelected = selectedCoupon?.id_coupon === coupon.id_coupon;
                    return (
                      <Chip
                        key={coupon.id_coupon}
                        label={`${coupon.name}  −${money(coupon.amount)}`}
                        size="small"
                        onClick={() => setSelectedCoupon(isSelected ? null : coupon)}
                        variant={isSelected ? "filled" : "outlined"}
                        sx={{
                          cursor: "pointer",
                          fontWeight: isSelected ? 700 : 400,
                          bgcolor: isSelected ? "#1f4b3b" : "#deebdf",
                          color: isSelected ? "#fff" : "#173a2d",
                          borderColor: "#b8d1c0",
                          "&:hover": { bgcolor: isSelected ? "#173a2d" : "#c8dece" },
                        }}
                      />
                    );
                  })
                )}
              </Stack>
              {selectedCoupon && (
                <Typography variant="caption" sx={{ mt: 0.8, display: "block", color: "#1f4b3b", fontWeight: 700 }}>
                  Cupón aplicado: {selectedCoupon.name} — descuento de {money(selectedCoupon.amount)} sobre el total
                </Typography>
              )}
            </Paper>
          )}

          <Box sx={{ mt: 2, display: "grid", gap: 1.2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            <FormControl size="small" fullWidth>
              <InputLabel id="consumption-service-label">Servicio</InputLabel>
              <Select
                labelId="consumption-service-label"
                label="Servicio"
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
              >
                {serviceOptions.map((service) => (
                  <MenuItem key={service.id_professional} value={String(service.id_professional)}>
                    {service.service_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Cantidad"
              type="number"
              size="small"
              value={selectedServiceQty}
              onChange={(e) => setSelectedServiceQty(e.target.value)}
              inputProps={{ min: 1, step: 1 }}
            />
            <TextField
              label="Monto unitario"
              type="number"
              size="small"
              value={selectedServiceAmount}
              onChange={(e) => setSelectedServiceAmount(e.target.value)}
              inputProps={{ min: 1, step: 0.01 }}
            />
          </Box>

          {selectedService && (
            <Typography variant="caption" sx={{ mt: 1, display: "block", color: "#4b675b" }}>
              {selectedService.accept_point === 1
                ? "Este servicio acumula puntos de consumo."
                : "Este servicio no acumula puntos."}
            </Typography>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.6 }}>
            <Button variant="outlined" onClick={addServiceToConsumption}>
              Agregar a la lista
            </Button>
            <Button variant="contained" sx={{ bgcolor: "#1f4b3b" }} onClick={() => void generateConsumptionQr()}>
              Generar codigo QR
            </Button>
            <Button variant="outlined" color="inherit" onClick={clearConsumptionForm}>
              Limpiar todo
            </Button>
          </Stack>

          <Paper variant="outlined" sx={{ mt: 2, borderColor: "#d6e4da", borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Servicio</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Unitario</TableCell>
                  <TableCell align="right">Subtotal</TableCell>
                  <TableCell align="right">Puntos</TableCell>
                  <TableCell align="center">Accion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consumptionItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>Aun no agregaste servicios al consumo.</TableCell>
                  </TableRow>
                )}
                {consumptionItems.map((item) => {
                  const lineTotal = item.quantity * item.unitAmount;
                  const linePoints = item.acceptPoint ? Math.floor(lineTotal / 1000) : 0;
                  return (
                    <TableRow key={item.idProfessional}>
                      <TableCell>{item.serviceName}</TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{money(item.unitAmount)}</TableCell>
                      <TableCell align="right">{money(lineTotal)}</TableCell>
                      <TableCell align="right">{linePoints}</TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          onClick={() => {
                            setConsumptionItems((prev) => prev.filter((entry) => entry.idProfessional !== item.idProfessional));
                          }}
                        >
                          Quitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Paper>

          <Paper
            sx={{
              mt: 1.4,
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#eef5f0",
              border: "1px solid #d6e4da",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
              <Typography variant="body2" fontWeight={700} color="#173a2d">
                Resumen del consumo
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                <Typography variant="body2">Subtotal: {money(consumptionSummary.subtotal)}</Typography>
                {consumptionSummary.couponDiscount > 0 && (
                  <Typography variant="body2" color="#c0392b">
                    Descuento: −{money(consumptionSummary.couponDiscount)}
                  </Typography>
                )}
                {consumptionSummary.couponDiscount > 0 && (
                  <Typography variant="body2" fontWeight={700} color="#1f4b3b">
                    Total: {money(consumptionSummary.discountedSubtotal)}
                  </Typography>
                )}
                <Typography variant="body2" color="#173a2d" fontWeight={700}>
                  Puntos estimados: {consumptionSummary.points}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Paper
            sx={{
              mt: 2,
              p: 2,
              borderRadius: 3,
              border: "1px dashed #b8d1c0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
            }}
          >
            {qrDataUrl ? <img src={qrDataUrl} alt={`QR ${selectedQrCode}`} width={220} height={220} /> : <Typography variant="caption">Completa el formulario y genera el QR de consumo</Typography>}
            {selectedQrCode && <Typography variant="body2">Codigo de consumo: {selectedQrCode}</Typography>}
            {customerSummary && (
              <Typography variant="caption" sx={{ color: "#4b675b" }}>
                Cliente asociado al consumo: {customerSummary.name}
              </Typography>
            )}
          </Paper>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.4 }}>
            <Button variant="outlined" onClick={handlePrintQr} disabled={!qrDataUrl}>
              Imprimir QR
            </Button>
            <Button variant="contained" sx={{ bgcolor: "#1f4b3b" }} onClick={handleDownloadQr} disabled={!qrDataUrl}>
              Descargar QR
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

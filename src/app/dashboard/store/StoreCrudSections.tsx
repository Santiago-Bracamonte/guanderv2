"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
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
import type { BenefitRow, CouponConsumptionRow, CouponRow, ServiceRow } from "./types";

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

type CouponStateOption = {
  id_coupon_state: number;
  name: string;
  description: string;
};

type CouponItem = CouponRow & {
  description: string;
  fk_coupon_state: number;
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

function formatDateInput(value: string): string {
  if (!value) return "";
  return value.slice(0, 10);
}

async function readJson<T>(res: Response): Promise<T> {
  return (await res.json()) as T;
}

function toCodeChunk(value: string, fallback: string): string {
  const cleaned = value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return cleaned || fallback;
}

function ensureGuanderCode(codeCoupon: string, couponName?: string): string {
  if (/^GUANDER-[A-Z0-9]+$/.test(codeCoupon.toUpperCase())) {
    return codeCoupon;
  }
  const codePart = toCodeChunk(codeCoupon || couponName || "CODIGO", "CODIGO");
  return `GUANDER-${codePart}`;
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

export function StoreCouponsCrudSection({
  initialCoupons,
  couponConsumptions,
}: {
  initialCoupons: CouponRow[];
  couponConsumptions: CouponConsumptionRow[];
}) {
  const PAGE_SIZE = 10;
  const [coupons, setCoupons] = useState<CouponItem[]>(
    initialCoupons.map((coupon) => ({
      ...coupon,
      description: "",
      fk_coupon_state: 0,
    })),
  );
  const [couponStates, setCouponStates] = useState<CouponStateOption[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [consumptionError, setConsumptionError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [selectedQrCode, setSelectedQrCode] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [serviceOptions, setServiceOptions] = useState<CouponServiceOption[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedServiceQty, setSelectedServiceQty] = useState("1");
  const [selectedServiceAmount, setSelectedServiceAmount] = useState("");
  const [consumptionItems, setConsumptionItems] = useState<ConsumptionFormItem[]>([]);
  const [customerSummary, setCustomerSummary] = useState<{ name: string; email: string } | null>(null);
  const [pendingDeleteCoupon, setPendingDeleteCoupon] = useState<CouponItem | null>(null);
  const [couponPage, setCouponPage] = useState(1);
  const [couponPageInput, setCouponPageInput] = useState("1");
  const [consumptionPage, setConsumptionPage] = useState(1);
  const [consumptionPageInput, setConsumptionPageInput] = useState("1");

  const [form, setForm] = useState({
    name: "",
    description: "",
    expirationDate: "",
    pointReq: "0",
    amount: "0",
    codeCoupon: "",
    couponStateId: "",
    enabled: true,
  });

  async function loadCoupons() {
    setError("");
    const res = await fetch("/api/store/coupons", { cache: "no-store" });
    const json = await readJson<{
      error?: string;
      data?: {
        coupons: CouponItem[];
        couponStates: CouponStateOption[];
      };
    }>(res);

    if (!res.ok || !json.data) {
      setError(json.error ?? "No se pudieron cargar cupones");
      return;
    }

    setCoupons(json.data.coupons);
    setCouponStates(json.data.couponStates);
  }

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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCoupons();
    void loadServiceOptions();
  }, []);

  const effectiveStateId = useMemo(() => {
    if (form.couponStateId) return form.couponStateId;
    return couponStates[0] ? String(couponStates[0].id_coupon_state) : "";
  }, [form.couponStateId, couponStates]);

  const couponTotalPages = useMemo(
    () => Math.max(1, Math.ceil(coupons.length / PAGE_SIZE)),
    [coupons.length],
  );

  const consumptionTotalPages = useMemo(
    () => Math.max(1, Math.ceil(couponConsumptions.length / PAGE_SIZE)),
    [couponConsumptions.length],
  );

  const safeCouponPage = Math.min(couponPage, couponTotalPages);
  const safeConsumptionPage = Math.min(consumptionPage, consumptionTotalPages);

  const paginatedCoupons = useMemo(() => {
    const start = (safeCouponPage - 1) * PAGE_SIZE;
    return coupons.slice(start, start + PAGE_SIZE);
  }, [coupons, safeCouponPage]);

  const paginatedCouponConsumptions = useMemo(() => {
    const start = (safeConsumptionPage - 1) * PAGE_SIZE;
    return couponConsumptions.slice(start, start + PAGE_SIZE);
  }, [couponConsumptions, safeConsumptionPage]);

  function changeCouponPage(next: number) {
    const clamped = Math.min(Math.max(next, 1), couponTotalPages);
    setCouponPage(clamped);
    setCouponPageInput(String(clamped));
  }

  function changeConsumptionPage(next: number) {
    const clamped = Math.min(Math.max(next, 1), consumptionTotalPages);
    setConsumptionPage(clamped);
    setConsumptionPageInput(String(clamped));
  }

  async function handleSubmit() {
    setError("");
    const payload = {
      idCoupon: editingId ?? undefined,
      name: form.name,
      description: form.description,
      expirationDate: form.expirationDate,
      pointReq: Number(form.pointReq),
      amount: Number(form.amount),
      codeCoupon: form.codeCoupon,
      couponStateId: Number(effectiveStateId),
      enabled: form.enabled,
    };

    const res = await fetch("/api/store/coupons", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(json.error ?? "No se pudo guardar el cupon");
      return;
    }

    setEditingId(null);
    setForm({
      name: "",
      description: "",
      expirationDate: "",
      pointReq: "0",
      amount: "0",
      codeCoupon: "",
      couponStateId: "",
      enabled: true,
    });

    await loadCoupons();
  }

  async function handleDelete(idCoupon: number) {
    const res = await fetch(`/api/store/coupons?idCoupon=${idCoupon}`, {
      method: "DELETE",
    });
    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(json.error ?? "No se pudo eliminar el cupon");
      return;
    }
    await loadCoupons();
  }

  function startEdit(coupon: CouponItem) {
    setEditingId(coupon.id_coupon);
    setForm({
      name: coupon.name,
      description: coupon.description,
      expirationDate: formatDateInput(coupon.expiration_date),
      pointReq: String(coupon.point_req),
      amount: String(coupon.amount),
      codeCoupon: coupon.code_coupon,
      couponStateId: String(coupon.fk_coupon_state),
      enabled: coupon.state === 1,
    });
  }

  const selectedService = useMemo(() => {
    if (!selectedServiceId) return null;
    return serviceOptions.find((service) => service.id_professional === Number(selectedServiceId)) ?? null;
  }, [selectedServiceId, serviceOptions]);

  const consumptionSummary = useMemo(() => {
    const subtotal = Number(
      consumptionItems.reduce((acc, item) => acc + item.quantity * item.unitAmount, 0).toFixed(2),
    );
    const points = consumptionItems.reduce((acc, item) => {
      if (!item.acceptPoint) return acc;
      return acc + Math.floor((item.quantity * item.unitAmount) / 1000);
    }, 0);
    return { subtotal, points };
  }, [consumptionItems]);

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
    setCustomerEmail("");
    setSelectedServiceId("");
    setSelectedServiceQty("1");
    setSelectedServiceAmount("");
    setConsumptionItems([]);
    setConsumptionError("");
    setCustomerSummary(null);
    setQrDataUrl("");
    setSelectedQrCode("");
  }

  async function generateConsumptionQr() {
    setConsumptionError("");

    if (!customerEmail.trim()) {
      setConsumptionError("El email del cliente es obligatorio");
      return;
    }

    if (consumptionItems.length === 0) {
      setConsumptionError("Agrega al menos un servicio antes de generar el QR");
      return;
    }

    const payload = {
      customerEmail: customerEmail.trim(),
      items: consumptionItems.map((item) => ({
        idProfessional: item.idProfessional,
        quantity: item.quantity,
        unitAmount: item.unitAmount,
      })),
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
            Cupones
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Crea, edita y elimina cupones. Puedes generar un QR para cada codigo.
          </Typography>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Box sx={{ mt: 2, display: "grid", gap: 1.2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            <TextField label="Nombre" size="small" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField label="Codigo (opcional)" size="small" value={form.codeCoupon} onChange={(e) => setForm((p) => ({ ...p, codeCoupon: e.target.value }))} />
            <TextField
              label="Descripcion"
              size="small"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
            <TextField
              label="Fecha vencimiento"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={form.expirationDate}
              onChange={(e) => setForm((p) => ({ ...p, expirationDate: e.target.value }))}
            />
            <TextField label="Puntos" type="number" size="small" value={form.pointReq} onChange={(e) => setForm((p) => ({ ...p, pointReq: e.target.value }))} />
            <TextField label="Monto" type="number" size="small" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
            <FormControl size="small" fullWidth>
              <InputLabel id="coupon-state-label">Estado de cupon</InputLabel>
              <Select
                labelId="coupon-state-label"
                label="Estado de cupon"
                value={effectiveStateId}
                onChange={(e) => setForm((p) => ({ ...p, couponStateId: e.target.value }))}
              >
                {couponStates.map((state) => (
                  <MenuItem key={state.id_coupon_state} value={String(state.id_coupon_state)}>
                    {state.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControlLabel
              control={<Switch checked={form.enabled} onChange={(e) => setForm((p) => ({ ...p, enabled: e.target.checked }))} />}
              label="Cupon habilitado"
            />
          </Box>

          <Stack direction="row" spacing={1} sx={{ mt: 1.8 }}>
            <Button variant="contained" sx={{ bgcolor: "#1f4b3b" }} onClick={() => void handleSubmit()}>
              {editingId ? "Actualizar cupon" : "Crear cupon"}
            </Button>
            {editingId && (
              <Button variant="outlined" onClick={() => setEditingId(null)}>
                Cancelar edicion
              </Button>
            )}
          </Stack>

          <Table size="small" sx={{ mt: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Cupon</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Canjes</TableCell>
                <TableCell>Vence</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {coupons.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>Aun no has creado cupones.</TableCell>
                </TableRow>
              )}
              {paginatedCoupons.map((coupon) => (
                <TableRow key={coupon.id_coupon}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{coupon.name}</Typography>
                    <Typography variant="caption">{ensureGuanderCode(coupon.code_coupon, coupon.name)}</Typography>
                  </TableCell>
                  <TableCell>{money(coupon.amount)}</TableCell>
                  <TableCell>{coupon.redemptions}</TableCell>
                  <TableCell>{when(coupon.expiration_date)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={coupon.coupon_state_name ?? (coupon.state === 1 ? "Activo" : "Inactivo")}
                      sx={{ bgcolor: "#deebdf", color: "#173a2d" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <Button size="small" variant="outlined" onClick={() => startEdit(coupon)}>
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => setPendingDeleteCoupon(coupon)}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {coupons.length > 0 && (
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1}
              sx={{ mt: 1.4 }}
            >
              <Typography variant="caption" sx={{ color: "#4b675b" }}>
                Pagina {safeCouponPage} de {couponTotalPages} · {coupons.length} registros
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button size="small" variant="outlined" disabled={safeCouponPage === 1} onClick={() => changeCouponPage(safeCouponPage - 1)}>
                  Anterior
                </Button>
                <TextField
                  size="small"
                  label="Pagina"
                  value={couponPageInput}
                  onChange={(e) => setCouponPageInput(e.target.value)}
                  sx={{ width: 100 }}
                  inputProps={{ inputMode: "numeric" }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const parsed = Number(couponPageInput);
                    if (!Number.isInteger(parsed)) return;
                    changeCouponPage(parsed);
                  }}
                >
                  Ir
                </Button>
                <Button size="small" variant="outlined" disabled={safeCouponPage >= couponTotalPages} onClick={() => changeCouponPage(safeCouponPage + 1)}>
                  Siguiente
                </Button>
              </Stack>
            </Stack>
          )}

          <DeleteConfirmDialog
            open={Boolean(pendingDeleteCoupon)}
            title="Eliminar cupon"
            description={`Vas a eliminar el cupon ${pendingDeleteCoupon?.name ?? ""}. Esta accion no se puede deshacer.`}
            onCancel={() => setPendingDeleteCoupon(null)}
            onConfirm={() => {
              if (pendingDeleteCoupon) {
                void handleDelete(pendingDeleteCoupon.id_coupon);
              }
              setPendingDeleteCoupon(null);
            }}
          />
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Typography variant="h6" color="#173a2d">
            Generar QR de consumo
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Agrega servicios del local, define cantidades y monto por item, y genera un QR asociado al cliente por email.
          </Typography>

          {consumptionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {consumptionError}
            </Alert>
          )}

          <Box sx={{ mt: 2, display: "grid", gap: 1.2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
            <TextField
              required
              label="Email del cliente"
              placeholder="cliente@email.com"
              size="small"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
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
              <Typography variant="body2">Subtotal: {money(consumptionSummary.subtotal)}</Typography>
              <Typography variant="body2" color="#173a2d" fontWeight={700}>
                Puntos estimados: {consumptionSummary.points}
              </Typography>
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
                Cliente asociado al consumo: {customerSummary.name} ({customerSummary.email})
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

      <Card elevation={0} sx={{ border: "1px solid #d6e4da" }}>
        <CardContent>
          <Typography variant="h6" color="#173a2d">
            Cupones consumidos
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Registro de clientes que canjearon cupones en tu local.
          </Typography>
          <Table size="small" sx={{ mt: 1.5 }}>
            <TableHead>
              <TableRow>
                <TableCell>Cliente</TableCell>
                <TableCell>Cupon</TableCell>
                <TableCell>Codigo</TableCell>
                <TableCell>Monto</TableCell>
                <TableCell>Puntos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {couponConsumptions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5}>Aun no hay consumos de cupones.</TableCell>
                </TableRow>
              )}
              {paginatedCouponConsumptions.map((entry) => (
                <TableRow key={entry.id_coupon_buy}>
                  <TableCell>{entry.customer_name} {entry.customer_last_name}</TableCell>
                  <TableCell>{entry.coupon_name}</TableCell>
                  <TableCell>{entry.code_coupon}</TableCell>
                  <TableCell>{money(entry.amount)}</TableCell>
                  <TableCell>{entry.point_req}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {couponConsumptions.length > 0 && (
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              spacing={1}
              sx={{ mt: 1.4 }}
            >
              <Typography variant="caption" sx={{ color: "#4b675b" }}>
                Pagina {safeConsumptionPage} de {consumptionTotalPages} · {couponConsumptions.length} registros
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Button size="small" variant="outlined" disabled={safeConsumptionPage === 1} onClick={() => changeConsumptionPage(safeConsumptionPage - 1)}>
                  Anterior
                </Button>
                <TextField
                  size="small"
                  label="Pagina"
                  value={consumptionPageInput}
                  onChange={(e) => setConsumptionPageInput(e.target.value)}
                  sx={{ width: 100 }}
                  inputProps={{ inputMode: "numeric" }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    const parsed = Number(consumptionPageInput);
                    if (!Number.isInteger(parsed)) return;
                    changeConsumptionPage(parsed);
                  }}
                >
                  Ir
                </Button>
                <Button size="small" variant="outlined" disabled={safeConsumptionPage >= consumptionTotalPages} onClick={() => changeConsumptionPage(safeConsumptionPage + 1)}>
                  Siguiente
                </Button>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

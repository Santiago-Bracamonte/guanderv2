"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

type BenefitProf = {
  id_benefit_prof: number;
  description: string;
  percentage: number;
  fk_professional: number;
  professional_name: string;
  professional_last_name: string;
  professional_description: string;
};

type BenefitStore = {
  id_benefit_store: number;
  description: string;
  percentage: number;
  req_point: number;
  fk_store: number;
  store_name: string;
};

type Professional = {
  id_professional: number;
  name: string;
  last_name: string;
};

type Store = {
  id_store: number;
  name: string;
};

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

export function AdminBenefitsCrudClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [benefitType, setBenefitType] = useState<"professional" | "store">(
    "professional",
  );
  const [benefitProf, setBenefitProf] = useState<BenefitProf[]>([]);
  const [benefitStore, setBenefitStore] = useState<BenefitStore[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{
    id: number;
    type: "professional" | "store";
    name: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPageProf, setCurrentPageProf] = useState(1);
  const [currentPageStore, setCurrentPageStore] = useState(1);
  const [itemsPerPage] = useState(10);

  const [form, setForm] = useState({
    description: "",
    percentage: "10",
    fkProfessional: "",
    fkStore: "",
  });

  async function loadBenefits() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/benefits", { cache: "no-store" });
      const json = await readJson<{
        success?: boolean;
        error?: string;
        data?: {
          benefitProf: BenefitProf[];
          benefitStore: BenefitStore[];
          professionals: Professional[];
          stores: Store[];
        };
      }>(res);

      if (!res.ok || !json.data) {
        throw new Error(json.error ?? "No se pudieron cargar los beneficios");
      }

      setBenefitProf(json.data.benefitProf);
      setBenefitStore(json.data.benefitStore);
      setProfessionals(json.data.professionals);
      setStores(json.data.stores);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar beneficios",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadBenefits();
  }, []);

  function resetForm() {
    setForm({
      description: "",
      percentage: "10",
      fkProfessional: "",
      fkStore: "",
    });
    setEditingId(null);
  }

  function validateForm(): string | null {
    if (!form.description.trim()) {
      return "La descripción es requerida";
    }
    const percent = Number(form.percentage);
    if (isNaN(percent) || percent <= 0 || percent > 100) {
      return "El porcentaje debe estar entre 1 y 100";
    }
    if (benefitType === "professional" && !form.fkProfessional) {
      return "Debes seleccionar un profesional";
    }
    if (benefitType === "store" && !form.fkStore) {
      return "Debes seleccionar una tienda";
    }
    return null;
  }

  async function handleSubmit() {
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      description: form.description,
      percentage: Number(form.percentage),
      type: benefitType,
      fkProfessional:
        benefitType === "professional"
          ? Number(form.fkProfessional)
          : undefined,
      fkStore: benefitType === "store" ? Number(form.fkStore) : undefined,
      idBenefitProf:
        editingId && benefitType === "professional" ? editingId : undefined,
      idBenefitStore:
        editingId && benefitType === "store" ? editingId : undefined,
    };

    const method = editingId ? "PUT" : "POST";

    const res = await fetch("/api/admin/benefits", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(json.error ?? "No se pudo guardar el beneficio");
      return;
    }

    resetForm();
    await loadBenefits();
  }

  async function handleDelete(id: number, type: "professional" | "store") {
    setError("");
    const res = await fetch(`/api/admin/benefits?id=${id}&type=${type}`, {
      method: "DELETE",
    });
    const json = await readJson<{ error?: string }>(res);
    if (!res.ok) {
      setError(json.error ?? "No se pudo eliminar el beneficio");
      return;
    }
    await loadBenefits();
  }

  function startEdit(
    item: BenefitProf | BenefitStore,
    type: "professional" | "store",
  ) {
    setBenefitType(type);
    setEditingId(
      "id_benefit_prof" in item ? item.id_benefit_prof : item.id_benefit_store,
    );
    setForm({
      description: item.description,
      percentage: String(item.percentage),
      fkProfessional:
        type === "professional"
          ? String((item as BenefitProf).fk_professional)
          : "",
      fkStore: type === "store" ? String((item as BenefitStore).fk_store) : "",
    });
  }

  const items = benefitType === "professional" ? benefitProf : benefitStore;
  const currentPage =
    benefitType === "professional" ? currentPageProf : currentPageStore;
  const setCurrentPage =
    benefitType === "professional" ? setCurrentPageProf : setCurrentPageStore;

  // Filtrar items por búsqueda
  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    if (benefitType === "professional") {
      const profItem = item as BenefitProf;
      return (
        profItem.professional_name?.toLowerCase().includes(searchLower) ||
        profItem.professional_last_name?.toLowerCase().includes(searchLower) ||
        profItem.description?.toLowerCase().includes(searchLower)
      );
    } else {
      const storeItem = item as BenefitStore;
      return (
        storeItem.store_name?.toLowerCase().includes(searchLower) ||
        storeItem.description?.toLowerCase().includes(searchLower)
      );
    }
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIdx, startIdx + itemsPerPage);

  return (
    <Stack
      spacing={2}
      sx={{ width: "100%", px: { xs: 0, sm: 1, md: 2, lg: 4 }, mx: "auto" }}
    >
      <Card
        elevation={0}
        sx={{
          border: "1px solid #d6e4da",
          width: "100%",
          maxWidth: { lg: "100%" },
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Typography
            variant="h6"
            color="#173a2d"
            sx={{ fontSize: { xs: "1.125rem", sm: "1.25rem" } }}
          >
            Gestión de Beneficios
          </Typography>
          <Typography
            variant="body2"
            sx={{ mt: 0.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}
          >
            Crea, edita y elimina beneficios para profesionales y tiendas.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              sx={{
                mb: 1,
                fontWeight: 600,
                fontSize: { xs: "0.8rem", sm: "0.875rem" },
              }}
            >
              Tipo de Beneficio
            </Typography>
            <ToggleButtonGroup
              value={benefitType}
              exclusive
              onChange={(_, newType) => {
                if (newType) {
                  setBenefitType(newType);
                  setCurrentPageProf(1);
                  setCurrentPageStore(1);
                }
              }}
              sx={{ width: "100%", display: "flex", flex: 1 }}
            >
              <ToggleButton
                value="professional"
                sx={{
                  textTransform: "none",
                  flex: 1,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Profesional
              </ToggleButton>
              <ToggleButton
                value="store"
                sx={{
                  textTransform: "none",
                  flex: 1,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Tienda
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              gap: 1.2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            <TextField
              label="Descripción *"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              fullWidth
              size="small"
              error={editingId !== null && !form.description.trim()}
              helperText={
                editingId !== null && !form.description.trim()
                  ? "Requerido"
                  : ""
              }
            />
            <TextField
              label="Porcentaje (%) *"
              type="number"
              value={form.percentage}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, percentage: e.target.value }))
              }
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 100 }}
              error={
                editingId !== null &&
                (Number(form.percentage) <= 0 || Number(form.percentage) > 100)
              }
            />
            {benefitType === "professional" && (
              <Autocomplete
                size="small"
                options={professionals}
                getOptionLabel={(prof) => `${prof.name} ${prof.last_name}`}
                value={
                  professionals.find(
                    (p) => String(p.id_professional) === form.fkProfessional,
                  ) || null
                }
                onChange={(_, newValue) =>
                  setForm((prev) => ({
                    ...prev,
                    fkProfessional: newValue
                      ? String(newValue.id_professional)
                      : "",
                  }))
                }
                disabled={editingId !== null}
                renderInput={(params) => (
                  <TextField {...params} label="Profesional *" />
                )}
              />
            )}
            {benefitType === "store" && (
              <Autocomplete
                size="small"
                options={stores}
                getOptionLabel={(store) => store.name}
                value={
                  stores.find((s) => String(s.id_store) === form.fkStore) ||
                  null
                }
                onChange={(_, newValue) =>
                  setForm((prev) => ({
                    ...prev,
                    fkStore: newValue ? String(newValue.id_store) : "",
                  }))
                }
                disabled={editingId !== null}
                renderInput={(params) => (
                  <TextField {...params} label="Tienda *" />
                )}
              />
            )}
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{ mt: 1.8 }}
          >
            <Button
              variant="contained"
              sx={{ bgcolor: "#1f4b3b", flex: { xs: 1, sm: "auto" } }}
              onClick={() => void handleSubmit()}
              disabled={
                !form.description.trim() ||
                Number(form.percentage) <= 0 ||
                Number(form.percentage) > 100 ||
                (benefitType === "professional" && !form.fkProfessional) ||
                (benefitType === "store" && !form.fkStore)
              }
            >
              {editingId ? "Actualizar beneficio" : "Crear beneficio"}
            </Button>
            {editingId && (
              <Button
                variant="outlined"
                onClick={resetForm}
                sx={{ flex: { xs: 1, sm: "auto" } }}
              >
                Cancelar edición
              </Button>
            )}
          </Stack>

          {/* Buscador */}
          <TextField
            fullWidth
            placeholder="Buscar por profesional/Tienda o descripción..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            size="small"
            sx={{
              mt: 2,
              mb: 2,
              "& input": { fontSize: { xs: "0.8rem", sm: "0.875rem" } },
            }}
          />

          <Box
            sx={{
              overflowX: { xs: "auto", md: "visible" },
              mt: 2,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <Table size="small" sx={{ width: "100%" }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      width: "25%",
                    }}
                  >
                    <strong>
                      {benefitType === "professional"
                        ? "Profesional"
                        : "Tienda"}
                    </strong>
                  </TableCell>
                  <TableCell
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      width: "40%",
                    }}
                  >
                    <strong>Descripción</strong>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      width: "15%",
                    }}
                  >
                    <strong>Porcentaje</strong>
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontSize: { xs: "0.75rem", sm: "0.875rem" },
                      width: "20%",
                    }}
                  >
                    <strong>Acciones</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && filteredItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      {items.length === 0
                        ? "No hay beneficios registrados aún."
                        : "No se encontraron resultados para tu búsqueda."}
                    </TableCell>
                  </TableRow>
                )}
                {paginatedItems.map((item) => {
                  const itemId =
                    benefitType === "professional"
                      ? (item as BenefitProf).id_benefit_prof
                      : (item as BenefitStore).id_benefit_store;

                  return (
                    <TableRow key={itemId}>
                      <TableCell
                        sx={{
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          width: "25%",
                        }}
                      >
                        {benefitType === "professional"
                          ? `${(item as BenefitProf).professional_name ?? "N/A"} ${(item as BenefitProf).professional_last_name ?? ""}`
                          : (item as BenefitStore).store_name}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          width: "40%",
                        }}
                      >
                        {item.description}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{
                          fontSize: { xs: "0.75rem", sm: "0.875rem" },
                          width: "15%",
                        }}
                      >
                        {item.percentage}%
                      </TableCell>
                      <TableCell align="center" sx={{ width: "20%" }}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={0.5}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => startEdit(item, benefitType)}
                            sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() =>
                              setPendingDelete({
                                id: itemId,
                                type: benefitType,
                                name: item.description,
                              })
                            }
                            sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}
                          >
                            Eliminar
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          {totalPages > 1 && (
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                justifyContent: "space-between",
                alignItems: { xs: "stretch", sm: "center" },
                gap: { xs: 1, sm: 0 },
                px: { xs: 0, sm: 2 },
                py: 2,
                borderTop: "1px solid #d6e4da",
              }}
            >
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  textAlign: { xs: "center", sm: "left" },
                }}
              >
                Página {currentPage} de {totalPages} ({filteredItems.length}{" "}
                beneficios{searchTerm && " encontrados"})
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  size="small"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  sx={{
                    flex: { xs: 1, sm: "auto" },
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  Anterior
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  sx={{
                    flex: { xs: 1, sm: "auto" },
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  Siguiente
                </Button>
              </Stack>
            </Box>
          )}

          <DeleteConfirmDialog
            open={Boolean(pendingDelete)}
            title="Eliminar beneficio"
            description={`Vas a eliminar el beneficio "${pendingDelete?.name}". Esta acción no se puede deshacer.`}
            onCancel={() => setPendingDelete(null)}
            onConfirm={() => {
              if (pendingDelete) {
                void handleDelete(pendingDelete.id, pendingDelete.type);
              }
              setPendingDelete(null);
            }}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}

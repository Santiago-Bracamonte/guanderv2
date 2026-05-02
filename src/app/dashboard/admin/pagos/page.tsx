"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";

type Payout = {
  id_sub_payout: number;
  date: string;
  amount: number;
  description: string;
  proof_url: string;
  status: string;
  fk_store_sub: number;
  fk_user: number;
  username: string;
  store_name: string;
  subscription_name: string;
};

export default function AdminPagosPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  async function fetchPayouts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/pagos");
      if (!res.ok) throw new Error("Error fetching payouts");
      const data = await res.json();
      setPayouts(data.payouts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatus(id_sub_payout: number, fk_store_sub: number, action: "approve" | "reject") {
    try {
      const res = await fetch("/api/admin/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id_sub_payout, id_store_sub: fk_store_sub }),
      });
      if (!res.ok) throw new Error("Action failed");
      fetchPayouts();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 4, color: "#173a2d", fontWeight: "bold" }}>
        Aprobación de Comprobantes de Pago
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #dcebe2" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#f3f9f5" }}>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Local</strong></TableCell>
              <TableCell><strong>Plan</strong></TableCell>
              <TableCell><strong>Estado</strong></TableCell>
              <TableCell><strong>Comprobante</strong></TableCell>
              <TableCell><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payouts.map((p) => (
              <TableRow key={p.id_sub_payout}>
                <TableCell>{p.id_sub_payout}</TableCell>
                <TableCell>{new Date(p.date).toLocaleString()}</TableCell>
                <TableCell>{p.store_name} ({p.username})</TableCell>
                <TableCell>{p.subscription_name}</TableCell>
                <TableCell>
                  <Chip
                    label={p.status}
                    color={
                      p.status === "approved" ? "success" : p.status === "rejected" ? "error" : "warning"
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {p.proof_url ? (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => window.open(p.proof_url, "_blank")} // Dummy URL / real S3 URL handling
                    >
                      Ver
                    </Button>
                  ) : (
                    "N/A"
                  )}
                </TableCell>
                <TableCell>
                  {p.status === "pending" && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleStatus(p.id_sub_payout, p.fk_store_sub, "approve")}
                      >
                        Aprobar
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleStatus(p.id_sub_payout, p.fk_store_sub, "reject")}
                      >
                        Rechazar
                      </Button>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

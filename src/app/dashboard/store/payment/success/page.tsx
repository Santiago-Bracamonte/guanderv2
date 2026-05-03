"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Procesando pago...");

  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    if (!paymentId) {
      setStatus("Pago confirmado, pero falta payment_id.");
      return;
    }

    fetch(`/api/store/subscribe/confirm?payment_id=${paymentId}`)
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "No se pudo confirmar el pago");
        }
        return res.json();
      })
      .then(() => {
        setStatus("Pago confirmado. Tu plan fue actualizado.");
        setTimeout(() => {
          window.location.href = "/dashboard/store";
        }, 1500);
      })
      .catch((err) => {
        setStatus(err.message || "No se pudo confirmar el pago.");
      });
  }, [searchParams]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Pago exitoso</h1>
      <p>{status}</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Procesando pago...</div>}>
      <SuccessContent />
    </Suspense>
  );
}

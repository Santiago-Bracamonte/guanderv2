import { describe, expect, it } from "vitest";
import {
  adminChangePasswordSchema,
  adminLoginSchema,
  adminNotificationLimitsSchema,
  adminProfessionalUpdateSchema,
  adminStoreCreateSchema,
  adminUserCreateSchema,
  benefitCreateSchema,
  categoryCreateSchema,
  pagosActionSchema,
  solicitudesPatchSchema,
  subscriptionCreateSchema,
  subscriptionInstancePaymentSchema,
} from "@/lib/validation/admin";

describe("admin schemas", () => {
  it("accepts admin login payload", () => {
    const result = adminLoginSchema.safeParse({
      email: "admin@example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("accepts admin change password payload", () => {
    const result = adminChangePasswordSchema.safeParse({
      currentPassword: "oldpass",
      newPassword: "newpass123",
      userId: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts benefit create payload", () => {
    const result = benefitCreateSchema.safeParse({
      description: "Beneficio",
      percentage: 10,
      type: "store",
      fkStore: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts admin user create payload", () => {
    const result = adminUserCreateSchema.safeParse({
      name: "Admin",
      email: "admin@example.com",
      username: "admin",
    });
    expect(result.success).toBe(true);
  });

  it("accepts solicitudes patch payload", () => {
    const result = solicitudesPatchSchema.safeParse({
      id_request: 10,
      action: "approve",
    });
    expect(result.success).toBe(true);
  });

  it("accepts subscription create payload", () => {
    const result = subscriptionCreateSchema.safeParse({
      name: "Plan",
      amount: 0,
      state: "activo",
    });
    expect(result.success).toBe(true);
  });

  it("accepts subscription instance payment payload", () => {
    const result = subscriptionInstancePaymentSchema.safeParse({
      id_store_sub: 1,
      amount: 1500,
    });
    expect(result.success).toBe(true);
  });

  it("accepts admin store create payload", () => {
    const result = adminStoreCreateSchema.safeParse({
      name: "Local",
      address: "Calle 123",
      fk_category: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts admin notification limits payload", () => {
    const result = adminNotificationLimitsSchema.safeParse({
      tier: "basic",
      cooldownMinutes: 10,
      maxPerHour: 10,
      maxPerDay: 50,
      maxPerMonth: 200,
    });
    expect(result.success).toBe(true);
  });

  it("accepts pagos action payload", () => {
    const result = pagosActionSchema.safeParse({
      action: "approve",
      id_sub_payout: 1,
      id_store_sub: 1,
    });
    expect(result.success).toBe(true);
  });

  it("accepts category create payload", () => {
    const result = categoryCreateSchema.safeParse({
      name: "Categoria",
    });
    expect(result.success).toBe(true);
  });

  it("accepts professional update payload", () => {
    const result = adminProfessionalUpdateSchema.safeParse({
      id_professional: 1,
      description: "Servicio",
    });
    expect(result.success).toBe(true);
  });
});

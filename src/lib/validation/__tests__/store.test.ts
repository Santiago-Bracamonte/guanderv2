import { describe, expect, it } from "vitest";
import {
  couponCreateSchema,
  couponUpdateSchema,
  consumptionQrSchema,
  notificationPushSchema,
  promotionCreateSchema,
  requestRegistrationSchema,
  recommendationSchema,
  reviewReplySchema,
  storeProfileUpdateSchema,
  subscriptionPreferenceSchema,
  subscriptionConfirmSchema,
  uploadPaymentProofSchema,
  uploadReceiptSchema,
  serviceCreateSchema,
} from "@/lib/validation/store";

describe("store schemas", () => {
  it("accepts valid promotion create", () => {
    const result = promotionCreateSchema.safeParse({
      description: "Promo",
      reqPoint: 0,
      percentage: 10,
    });
    expect(result.success).toBe(true);
  });

  it("rejects promotion with invalid percentage", () => {
    const result = promotionCreateSchema.safeParse({
      description: "Promo",
      reqPoint: 0,
      percentage: 200,
    });
    expect(result.success).toBe(false);
  });

  it("accepts service create payload", () => {
    const result = serviceCreateSchema.safeParse({
      description: "Servicio",
      typeServiceId: 1,
      scheduleId: 2,
      acceptPoint: true,
    });
    expect(result.success).toBe(true);
  });

  it("accepts coupon create payload", () => {
    const result = couponCreateSchema.safeParse({
      name: "Cupon",
      description: "Descuento",
      expirationDate: "2030-01-01",
      pointReq: 10,
      amount: 15,
    });
    expect(result.success).toBe(true);
  });

  it("rejects coupon update without idCoupon", () => {
    const result = couponUpdateSchema.safeParse({
      name: "Cupon",
      description: "Descuento",
      expirationDate: "2030-01-01",
      pointReq: 10,
      amount: 15,
      couponStateId: 1,
    });
    expect(result.success).toBe(false);
  });

  it("accepts review reply payload", () => {
    const result = reviewReplySchema.safeParse({
      commentId: 1,
      body: "Gracias",
    });
    expect(result.success).toBe(true);
  });

  it("accepts registration request payload", () => {
    const result = requestRegistrationSchema.safeParse({
      business_name: "Local",
      address: "Calle 123",
      fk_category: 3,
    });
    expect(result.success).toBe(true);
  });

  it("accepts profile update payload", () => {
    const result = storeProfileUpdateSchema.safeParse({
      name: "Mi local",
      gallery_urls: ["https://example.com/img.jpg"],
      social_web: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts notification push payload", () => {
    const result = notificationPushSchema.safeParse({
      title: "Hola",
      message: "Mensaje",
      expirationDays: 7,
    });
    expect(result.success).toBe(true);
  });

  it("accepts recommendation payload", () => {
    const result = recommendationSchema.safeParse({
      email: "user@example.com",
      recommendation: "Muy bueno",
    });
    expect(result.success).toBe(true);
  });

  it("accepts subscription preference payload", () => {
    const result = subscriptionPreferenceSchema.safeParse({
      planId: 1,
      planName: "Pro",
      amount: 1200,
    });
    expect(result.success).toBe(true);
  });

  it("accepts subscription confirm payload", () => {
    const result = subscriptionConfirmSchema.safeParse({
      paymentId: "123",
    });
    expect(result.success).toBe(true);
  });

  it("accepts upload receipt payload", () => {
    const result = uploadReceiptSchema.safeParse({
      proofUrl: "https://example.com/proof.png",
    });
    expect(result.success).toBe(true);
  });

  it("accepts upload payment proof payload", () => {
    const result = uploadPaymentProofSchema.safeParse({
      paymentProof: "data:image/png;base64,AAA",
    });
    expect(result.success).toBe(true);
  });

  it("accepts consumption QR payload", () => {
    const result = consumptionQrSchema.safeParse({
      customerEmail: "client@example.com",
      items: [{ idProfessional: 1, quantity: 2, unitAmount: 1000 }],
    });
    expect(result.success).toBe(true);
  });
});

import { z } from "zod";
import {
  dateStringSchema,
  nonNegativeIntSchema,
  optionalPositiveIntSchema,
  percentageSchema,
  positiveAmountSchema,
  positiveIntSchema,
  requiredText,
} from "./common";

export const promotionCreateSchema = z.object({
  description: requiredText("description", 300),
  reqPoint: nonNegativeIntSchema("reqPoint"),
  percentage: percentageSchema("percentage"),
});

export const promotionUpdateSchema = z.object({
  idBenefitStore: positiveIntSchema("idBenefitStore"),
  description: requiredText("description", 300),
  reqPoint: nonNegativeIntSchema("reqPoint"),
  percentage: percentageSchema("percentage"),
});

export const promotionDeleteSchema = z.object({
  idBenefitStore: positiveIntSchema("idBenefitStore"),
});

export const serviceCreateSchema = z.object({
  description: requiredText("description", 400),
  address: z.string().trim().max(200, "address inválido").optional(),
  location: z.string().trim().max(120, "location inválido").optional(),
  acceptPoint: z.boolean().optional(),
  typeServiceId: positiveIntSchema("typeServiceId"),
  scheduleId: positiveIntSchema("scheduleId"),
});

export const serviceUpdateSchema = z.object({
  idProfessional: positiveIntSchema("idProfessional"),
  description: requiredText("description", 400),
  address: z.string().trim().max(200, "address inválido").optional(),
  location: z.string().trim().max(120, "location inválido").optional(),
  acceptPoint: z.boolean().optional(),
  typeServiceId: positiveIntSchema("typeServiceId"),
  scheduleId: positiveIntSchema("scheduleId"),
});

export const serviceDeleteSchema = z.object({
  idProfessional: positiveIntSchema("idProfessional"),
});

export const couponCreateSchema = z.object({
  name: requiredText("name", 120),
  description: requiredText("description", 350),
  expirationDate: dateStringSchema("expirationDate"),
  pointReq: nonNegativeIntSchema("pointReq"),
  amount: percentageSchema("amount"),
  codeCoupon: z.string().trim().max(80, "codeCoupon inválido").optional(),
  couponStateId: optionalPositiveIntSchema("couponStateId"),
  enabled: z.boolean().optional(),
});

export const couponUpdateSchema = z.object({
  idCoupon: positiveIntSchema("idCoupon"),
  name: requiredText("name", 120),
  description: requiredText("description", 350),
  expirationDate: dateStringSchema("expirationDate"),
  pointReq: nonNegativeIntSchema("pointReq"),
  amount: percentageSchema("amount"),
  codeCoupon: z.string().trim().max(80, "codeCoupon inválido").optional(),
  couponStateId: positiveIntSchema("couponStateId"),
  enabled: z.boolean().optional(),
});

export const couponDeleteSchema = z.object({
  idCoupon: positiveIntSchema("idCoupon"),
});

export const reviewReplySchema = z.object({
  commentId: positiveIntSchema("commentId"),
  body: requiredText("body", 600),
});

export const requestRegistrationSchema = z.object({
  business_name: requiredText("business_name", 200),
  description: z.string().trim().max(500, "description inválido").optional(),
  address: requiredText("address", 200),
  location: z.string().trim().max(120, "location inválido").optional(),
  fk_category: optionalPositiveIntSchema("fk_category"),
  cuit_cuil: z.string().trim().max(30, "cuit_cuil inválido").optional(),
  matricula: z.string().trim().max(30, "matricula inválido").optional(),
  razon_social: z.string().trim().max(120, "razon_social inválido").optional(),
  schedule_week: z.string().trim().max(120, "schedule_week inválido").optional(),
  schedule_weekend: z.string().trim().max(120, "schedule_weekend inválido").optional(),
  schedule_sunday: z.string().trim().max(120, "schedule_sunday inválido").optional(),
  image_url: z.string().trim().max(300, "image_url inválido").optional(),
  fk_subscription_id: optionalPositiveIntSchema("fk_subscription_id"),
});

export const storeProfileUpdateSchema = z.object({
  name: z.string().trim().max(120, "name inválido").optional(),
  description: z.string().trim().max(800, "description inválido").optional(),
  address: z.string().trim().max(200, "address inválido").optional(),
  location: z.string().trim().max(120, "location inválido").optional(),
  image_url: z.string().trim().max(300, "image_url inválido").nullable().optional(),
  gallery_urls: z.array(z.string().trim().max(300, "gallery_urls inválido")).optional(),
  fk_category: optionalPositiveIntSchema("fk_category"),
  schedule_week: z.string().trim().max(120, "schedule_week inválido").optional(),
  schedule_weekend: z.string().trim().max(120, "schedule_weekend inválido").optional(),
  schedule_sunday: z.string().trim().max(120, "schedule_sunday inválido").optional(),
  social_web: z.string().trim().max(200, "social_web inválido").nullable().optional(),
  social_instagram: z.string().trim().max(200, "social_instagram inválido").nullable().optional(),
  social_twitter: z.string().trim().max(200, "social_twitter inválido").nullable().optional(),
  social_whatsapp: z.string().trim().max(200, "social_whatsapp inválido").nullable().optional(),
});

export const notificationPushSchema = z.object({
  title: requiredText("title", 90),
  message: requiredText("message", 450),
  expirationDays: z
    .preprocess((value) => (value === undefined ? undefined : Number(value)),
      z.number({ invalid_type_error: "expirationDays inválido" })
        .int("expirationDays inválido")
        .min(1, "expirationDays inválido")
        .max(30, "expirationDays inválido")
        .optional(),
    ),
});

export const recommendationSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido"),
  recommendation: requiredText("recommendation", 1200),
});

export const subscriptionPreferenceSchema = z.object({
  planId: positiveIntSchema("planId"),
  planName: requiredText("planName", 120),
  planDescription: z.string().trim().max(256, "planDescription inválido").optional(),
  amount: z.preprocess(
    (value) => Number(value),
    z.number({ invalid_type_error: "amount inválido" }).positive("amount inválido"),
  ),
});

export const subscriptionConfirmSchema = z.object({
  paymentId: z.string().trim().min(1, "payment_id o collection_id requerido"),
});

export const uploadReceiptSchema = z.object({
  proofUrl: requiredText("proofUrl", 500),
  description: z.string().trim().max(200, "description inválido").optional(),
});

export const uploadPaymentProofSchema = z.object({
  paymentProof: requiredText("paymentProof", 2000000),
});

export const consumptionQrSchema = z.object({
  customerEmail: z.string().trim().toLowerCase().email("Email inválido").optional(),
  couponCode: z.string().trim().max(80, "couponCode inválido").optional(),
  items: z
    .array(
      z.object({
        idProfessional: positiveIntSchema("idProfessional"),
        quantity: positiveIntSchema("quantity"),
        unitAmount: positiveAmountSchema("unitAmount"),
      }),
    )
    .min(1, "Debes agregar al menos un servicio al consumo"),
});

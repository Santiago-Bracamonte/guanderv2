import { z } from "zod";
import {
  dateStringSchema,
  emailSchema,
  nonNegativeIntSchema,
  percentageSchema,
  positiveIntSchema,
  requiredText,
} from "./common";

const ADMIN_ROLES = ["admin", "customer", "store_owner", "professional"] as const;

export const adminLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Email y contraseña requeridos"),
});

export const adminChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual y nueva son requeridas"),
  newPassword: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  userId: positiveIntSchema("userId"),
});

export const benefitCreateSchema = z
  .object({
    description: requiredText("Descripción", 300),
    percentage: percentageSchema("percentage"),
    type: z.enum(["professional", "store"]),
    fkProfessional: positiveIntSchema("fkProfessional").optional(),
    fkStore: positiveIntSchema("fkStore").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "professional" && !data.fkProfessional) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Profesional es obligatorio" });
    }
    if (data.type === "store" && !data.fkStore) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Tienda es obligatoria" });
    }
  });

export const benefitUpdateSchema = z
  .object({
    description: requiredText("Descripción", 300),
    percentage: percentageSchema("percentage"),
    type: z.enum(["professional", "store"]),
    idBenefitProf: positiveIntSchema("idBenefitProf").optional(),
    idBenefitStore: positiveIntSchema("idBenefitStore").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "professional" && !data.idBenefitProf) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ID de beneficio requerido" });
    }
    if (data.type === "store" && !data.idBenefitStore) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "ID de beneficio requerido" });
    }
  });

export const benefitDeleteSchema = z.object({
  id: positiveIntSchema("id"),
  type: z.enum(["professional", "store"]),
});

export const adminUserCreateSchema = z.object({
  name: requiredText("Nombre", 120),
  lastName: z.string().trim().max(120, "Apellido inválido").optional(),
  email: emailSchema,
  tel: z.string().trim().max(40, "Teléfono inválido").optional(),
  username: requiredText("username", 80),
  rol: z.enum(ADMIN_ROLES).optional(),
});

export const adminUserDeleteSchema = z.object({
  id: positiveIntSchema("id"),
});

export const adminUserPatchSchema = z.object({
  id_user: positiveIntSchema("id_user"),
  name: z.string().trim().max(120, "Nombre inválido").optional(),
  lastName: z.string().trim().max(120, "Apellido inválido").optional(),
  email: emailSchema.optional(),
  tel: z.string().trim().max(40, "Teléfono inválido").optional(),
  state: z.preprocess(
    (value) => (value === undefined ? undefined : Number(value)),
    z.number({ invalid_type_error: "state inválido" }).int().min(0).max(1).optional(),
  ),
});

export const solicitudesStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).optional(),
});

export const solicitudesPatchSchema = z.object({
  id_request: positiveIntSchema("id_request"),
  action: z.enum(["approve", "reject"]),
  notes: z.string().trim().max(500, "notes inválido").optional(),
});

export const subscriptionCreateSchema = z.object({
  name: requiredText("name", 120),
  description: z.string().trim().max(500, "description inválido").optional(),
  plan_benefits: z.string().trim().max(2000, "plan_benefits inválido").optional(),
  state: z.enum(["activo", "inactivo"]).optional(),
  amount: nonNegativeIntSchema("amount"),
});

export const subscriptionUpdateSchema = z.object({
  id_subscription: positiveIntSchema("id_subscription"),
  name: requiredText("name", 120),
  description: z.string().trim().max(500, "description inválido").optional(),
  plan_benefits: z.string().trim().max(2000, "plan_benefits inválido").optional(),
  state: z.enum(["activo", "inactivo"]).optional(),
  amount: nonNegativeIntSchema("amount"),
});

export const subscriptionInstanceUpdateSchema = z.object({
  id_store_sub: positiveIntSchema("id_store_sub"),
  state_payout: z.enum(["activo", "inactivo", "pendiente", "vencido"]).optional(),
  expiration_date: dateStringSchema("expiration_date").optional(),
  fk_subscription_id: positiveIntSchema("fk_subscription_id").optional(),
});

export const subscriptionInstancePaymentSchema = z.object({
  id_store_sub: positiveIntSchema("id_store_sub"),
  amount: positiveIntSchema("amount"),
  date: dateStringSchema("date").optional(),
  description: z.string().trim().max(200, "description inválido").optional(),
});

export const adminStoreCreateSchema = z.object({
  name: requiredText("name", 120),
  description: z.string().trim().max(800, "description inválido").optional(),
  address: z.string().trim().max(200, "address inválido").optional(),
  location: z.string().trim().max(120, "location inválido").nullable().optional(),
  fk_category: positiveIntSchema("fk_category").optional(),
  stars: z.preprocess(
    (value) => (value === undefined ? undefined : Number(value)),
    z.number({ invalid_type_error: "stars inválido" }).min(0).max(5).optional(),
  ),
  user_email: emailSchema.optional(),
  image_url: z.string().trim().max(300, "image_url inválido").optional(),
});

export const adminStoreUpdateSchema = z.object({
  id_store: positiveIntSchema("id_store"),
  name: z.string().trim().max(120, "name inválido").optional(),
  description: z.string().trim().max(800, "description inválido").optional(),
  address: z.string().trim().max(200, "address inválido").optional(),
  location: z.string().trim().max(120, "location inválido").nullable().optional(),
  stars: z.preprocess(
    (value) => (value === undefined ? undefined : Number(value)),
    z.number({ invalid_type_error: "stars inválido" }).min(0).max(5).optional(),
  ),
  fk_category: positiveIntSchema("fk_category").optional(),
  image_url: z.string().trim().max(300, "image_url inválido").optional(),
  schedule_week: z.string().trim().max(120, "schedule_week inválido").optional().nullable(),
  schedule_weekend: z.string().trim().max(120, "schedule_weekend inválido").optional().nullable(),
  schedule_sunday: z.string().trim().max(120, "schedule_sunday inválido").optional().nullable(),
});

export const adminStoreDeleteSchema = z.object({
  id: positiveIntSchema("id"),
  action: z.enum(["delete", "deactivate", "activate"]).optional(),
});

export const categoryCreateSchema = z.object({
  name: requiredText("name", 120),
  description: z.string().trim().max(300, "description inválido").optional(),
});

export const categoryUpdateSchema = z.object({
  id: positiveIntSchema("id"),
  name: requiredText("name", 120),
  description: z.string().trim().max(300, "description inválido").optional(),
});

export const categoryDeleteSchema = z.object({
  id: positiveIntSchema("id"),
});

export const adminNotificationLimitsSchema = z
  .object({
    tier: z.enum(["basic", "plus", "premium"]),
    cooldownMinutes: positiveIntSchema("cooldownMinutes"),
    maxPerHour: positiveIntSchema("maxPerHour"),
    maxPerDay: positiveIntSchema("maxPerDay"),
    maxPerMonth: positiveIntSchema("maxPerMonth"),
  })
  .superRefine((data, ctx) => {
    if (data.maxPerHour > data.maxPerDay || data.maxPerDay > data.maxPerMonth) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La jerarquia de limites debe cumplir: maxPerHour <= maxPerDay <= maxPerMonth",
      });
    }
  });

export const pagosActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  id_sub_payout: positiveIntSchema("id_sub_payout"),
  id_store_sub: positiveIntSchema("id_store_sub"),
});

export const adminProfessionalUpdateSchema = z.object({
  id_professional: positiveIntSchema("id_professional"),
  description: z.string().trim().max(500, "description inválido").optional(),
  address: z.string().trim().max(200, "address inválido").optional(),
  location: z.string().trim().max(120, "location inválido").nullable().optional(),
  stars: z.preprocess(
    (value) => (value === undefined ? undefined : Number(value)),
    z.number({ invalid_type_error: "stars inválido" }).min(0).max(5).optional(),
  ),
  accept_point: z.preprocess(
    (value) => (value === undefined ? undefined : Number(value)),
    z.number({ invalid_type_error: "accept_point inválido" }).int().min(0).max(1).optional(),
  ),
  fk_type_service: positiveIntSchema("fk_type_service").optional(),
  schedule_week: z.string().trim().max(120, "schedule_week inválido").optional().nullable(),
  schedule_weekend: z.string().trim().max(120, "schedule_weekend inválido").optional().nullable(),
  schedule_sunday: z.string().trim().max(120, "schedule_sunday inválido").optional().nullable(),
  image_url: z.string().trim().max(300, "image_url inválido").optional().nullable(),
});

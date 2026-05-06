import { z } from "zod";
import { emailSchema, optionalText, passwordSchema } from "./common";

const ALLOWED_REGISTER_ROLES = ["professional", "store_owner"] as const;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Email y contraseña requeridos"),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirmación requerida"),
    role: z.enum(ALLOWED_REGISTER_ROLES, {
      errorMap: () => ({ message: "Solo clientes y profesionales pueden registrarse" }),
    }),
    name: optionalText("Nombre", 100),
    lastName: optionalText("Apellido", 100),
    tel: optionalText("Teléfono", 40),
    address: optionalText("Dirección", 200),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Las contraseñas no coinciden",
        path: ["confirmPassword"],
      });
    }
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, "Token requerido"),
  password: passwordSchema,
});

import { z } from "zod";

const toNumber = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? Number(value) : value;

const emptyToUndefined = (value: unknown) =>
  value === "" || value === null ? undefined : value;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email requerido")
  .email("Email inválido");

export const passwordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres");

export const requiredText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} requerido`)
    .max(max, `${label} demasiado largo`);

export const optionalText = (label: string, max: number) =>
  z
    .string()
    .trim()
    .max(max, `${label} demasiado largo`)
    .optional();

export const positiveIntSchema = (label: string) =>
  z.preprocess(
    toNumber,
    z
      .number({ invalid_type_error: `${label} inválido` })
      .int(`${label} inválido`)
      .positive(`${label} inválido`),
  );

export const nonNegativeIntSchema = (label: string) =>
  z.preprocess(
    toNumber,
    z
      .number({ invalid_type_error: `${label} inválido` })
      .int(`${label} inválido`)
      .min(0, `${label} inválido`),
  );

export const optionalPositiveIntSchema = (label: string) =>
  z.preprocess(
    (value) => emptyToUndefined(toNumber(value)),
    z
      .number({ invalid_type_error: `${label} inválido` })
      .int(`${label} inválido`)
      .positive(`${label} inválido`)
      .optional(),
  );

export const percentageSchema = (label: string) =>
  z.preprocess(
    toNumber,
    z
      .number({ invalid_type_error: `${label} inválido` })
      .min(1, `${label} inválido`)
      .max(100, `${label} inválido`),
  );

export const positiveAmountSchema = (label: string) =>
  z.preprocess(
    toNumber,
    z
      .number({ invalid_type_error: `${label} inválido` })
      .positive(`${label} inválido`),
  );

export const dateStringSchema = (label: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} inválido`);

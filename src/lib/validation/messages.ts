import { z } from "zod";
import { optionalPositiveIntSchema, positiveIntSchema } from "./common";

export const userMessageSchema = z.object({
  subject: z.string().trim().max(200, "Asunto demasiado largo").optional(),
  message: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje no puede estar vacío"),
  ticketId: optionalPositiveIntSchema("ticketId"),
});

export const adminMessageSchema = z.object({
  ticketId: positiveIntSchema("ticketId"),
  message: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje no puede estar vacío"),
  status: z.enum(["closed"]).optional(),
});

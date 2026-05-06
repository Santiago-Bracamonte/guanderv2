import { z } from "zod";
import { emailSchema, optionalText, requiredText } from "./common";

export const contactSchema = z.object({
  name: requiredText("Nombre", 100),
  email: emailSchema,
  subject: optionalText("Asunto", 200),
  message: requiredText("Mensaje", 2000),
});

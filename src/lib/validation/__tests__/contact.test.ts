import { describe, expect, it } from "vitest";
import { contactSchema } from "@/lib/validation/contact";

describe("contact schema", () => {
  it("accepts valid contact payload", () => {
    const result = contactSchema.safeParse({
      name: "Maria",
      email: "maria@example.com",
      subject: "Consulta",
      message: "Hola, necesito ayuda",
    });
    expect(result.success).toBe(true);
  });

  it("rejects contact payload without message", () => {
    const result = contactSchema.safeParse({
      name: "Maria",
      email: "maria@example.com",
      message: " ",
    });
    expect(result.success).toBe(false);
  });
});

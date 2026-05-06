import { describe, expect, it } from "vitest";
import {
  adminMessageSchema,
  userMessageSchema,
} from "@/lib/validation/messages";

describe("messages schemas", () => {
  it("accepts valid user message", () => {
    const result = userMessageSchema.safeParse({
      subject: "Ayuda",
      message: "Necesito soporte",
    });
    expect(result.success).toBe(true);
  });

  it("rejects user message without content", () => {
    const result = userMessageSchema.safeParse({
      message: " ",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid admin message", () => {
    const result = adminMessageSchema.safeParse({
      ticketId: 10,
      message: "Respuesta",
      status: "closed",
    });
    expect(result.success).toBe(true);
  });

  it("rejects admin message without ticketId", () => {
    const result = adminMessageSchema.safeParse({
      message: "Respuesta",
    });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validation/auth";

describe("auth schemas", () => {
  it("accepts valid login payload", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "secret",
    });
    expect(result.success).toBe(true);
  });

  it("rejects login without password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects register with mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password124",
      role: "professional",
    });
    expect(result.success).toBe(false);
  });

  it("accepts register with valid fields", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      confirmPassword: "password123",
      role: "store_owner",
      name: "Juan",
      lastName: "Perez",
      tel: "+549111111",
      address: "Calle 123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects forgot password with invalid email", () => {
    const result = forgotPasswordSchema.safeParse({
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects reset password with short password", () => {
    const result = resetPasswordSchema.safeParse({
      token: "token",
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

import { ZodSchema } from "zod";

export async function parseJson<T>(
  request: Request,
  schema: ZodSchema<T>,
  fallbackError = "Datos inválidos",
): Promise<{ data?: T; error?: string }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: "Cuerpo inválido" };
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? fallbackError };
  }

  return { data: result.data };
}

export function parseSearchParams<T>(
  values: Record<string, unknown>,
  schema: ZodSchema<T>,
  fallbackError = "Datos inválidos",
): { data?: T; error?: string } {
  const result = schema.safeParse(values);
  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? fallbackError };
  }

  return { data: result.data };
}

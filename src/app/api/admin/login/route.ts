import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { adminLoginSchema } from "@/lib/validation/admin";
import { parseJson } from "@/lib/validation/parse";

export async function POST(request: Request) {
  const parsed = await parseJson(request, adminLoginSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const admin = await verifyAdmin(email, password);

  if (!admin) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 },
    );
  }

  const sessionData = btoa(
    JSON.stringify({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    }),
  );

  const response = NextResponse.json({
    success: true,
    admin: { name: admin.name, role: admin.role },
  });

  response.cookies.set("admin_session", sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return response;
}

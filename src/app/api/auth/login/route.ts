import { NextRequest, NextResponse } from "next/server";
import { CloudflareD1Error, queryD1 } from "@/lib/cloudflare-d1";
import { comparePassword, generateToken } from "@/lib/auth";
import { loginSchema } from "@/lib/validation/auth";
import { parseJson } from "@/lib/validation/parse";

interface UserRow {
  id_user?: number;
  username: string;
  email: string;
  password_hash: string;
  rol?: string;
  name?: string;
  last_name?: string;
}

const ALLOWED_ROLES = ["admin", "professional", "store_owner"];

export async function POST(request: NextRequest) {
  const parsed = await parseJson(
    request,
    loginSchema,
    "Datos inválidos recibidos",
  );
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { email, password } = parsed.data;

  try {
    // Query user with role - JOIN user_data and roles
    const users = await queryD1<UserRow>(
      `SELECT u.id_user, u.username, ud.email, ud.password_hash, ud.name, ud.last_name, r.rol 
       FROM users u 
       JOIN user_data ud ON u.fk_user_data = ud.id_user_data 
       JOIN roles r ON u.fk_rol = r.id_rol 
       WHERE ud.email = ?`,
      [email],
    );

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 401 },
      );
    }

    const user = users[0];

    // Check if role is allowed to login
    if (!ALLOWED_ROLES.includes(user.rol || "")) {
      return NextResponse.json(
        { error: "Tu rol no tiene acceso al login" },
        { status: 403 },
      );
    }

    // Compare passwords
    const passwordMatch = await comparePassword(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Contraseña incorrecta" },
        { status: 401 },
      );
    }

    // Generate token
    const token = generateToken({
      id: user.id_user || 0,
      email: user.email,
      role: user.rol || "",
    });

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id_user,
          email: user.email,
          username: user.username,
          role: user.rol,
          name: user.name,
          lastName: user.last_name,
        },
      },
      { status: 200 },
    );

    // Set httpOnly cookie for token
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    // Manejo específico de errores
    if (error instanceof CloudflareD1Error) {
      console.error("Database connection error:", error.message);
      return NextResponse.json(
        { error: "Error en la base de datos. Intenta más tarde." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Error en el servidor. Intenta más tarde." },
      { status: 500 },
    );
  }
}

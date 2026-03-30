import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { hashPassword, generateToken } from "@/lib/auth";

interface RoleRow {
  id_rol?: number;
  rol: string;
}

const ALLOWED_REGISTER_ROLES = ["customer", "professional"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      confirmPassword,
      role,
      name,
      lastName,
      tel,
      address,
    } = body;

    // Validate input
    if (!email || !password || !confirmPassword || !role) {
      return NextResponse.json(
        { error: "Email, contraseña y rol requeridos" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden" },
        { status: 400 },
      );
    }

    if (!ALLOWED_REGISTER_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Solo clientes y profesionales pueden registrarse" },
        { status: 403 },
      );
    }

    // Check if email already exists
    const existingUsers = await queryD1<{ email: string }>(
      "SELECT email FROM user_data WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { error: "El email ya está registrado" },
        { status: 409 },
      );
    }

    // Get role ID
    const roleRows = await queryD1<RoleRow>(
      "SELECT id_rol FROM roles WHERE rol = ?",
      [role],
    );

    if (roleRows.length === 0 || !roleRows[0].id_rol) {
      return NextResponse.json({ error: "Rol no válido" }, { status: 400 });
    }

    const roleId = roleRows[0].id_rol;

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert into user_data table first
    await queryD1(
      `INSERT INTO user_data (name, last_name, tel, email, address, password_hash) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name || "Usuario",
        lastName || "Nuevo",
        tel || "",
        email,
        address || "",
        hashedPassword,
      ],
    );

    // Get the new user_data ID
    const userDataRows = await queryD1<{ id_user_data?: number }>(
      "SELECT id_user_data FROM user_data WHERE email = ?",
      [email],
    );

    if (userDataRows.length === 0) {
      return NextResponse.json(
        { error: "Error al crear los datos del usuario" },
        { status: 500 },
      );
    }

    const userDataId = userDataRows[0].id_user_data || 0;

    // Insert into users table
    await queryD1(
      "INSERT INTO users (username, fk_user_data, fk_rol) VALUES (?, ?, ?)",
      [email, userDataId, roleId],
    );

    // Get the new user ID
    const newUsers = await queryD1<{ id_user?: number }>(
      "SELECT id_user FROM users WHERE fk_user_data = ?",
      [userDataId],
    );

    if (newUsers.length === 0) {
      return NextResponse.json(
        { error: "Error al crear el usuario" },
        { status: 500 },
      );
    }

    const newUserId = newUsers[0].id_user;

    // Generate token
    const token = generateToken({
      id: newUserId || 0,
      email,
      role,
    });

    const response = NextResponse.json(
      {
        success: true,
        message: "Usuario registrado exitosamente",
        token,
        user: {
          id: newUserId,
          email,
          role,
          name: name || "Usuario",
          lastName: lastName || "Nuevo",
        },
      },
      { status: 201 },
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
    console.error("Register error:", error);

    // Manejo específico de errores
    if (error instanceof Error) {
      if (error.message.includes("CloudflareD1Error")) {
        console.error("Database connection error:", error.message);
        return NextResponse.json(
          { error: "Error en la base de datos. Intenta más tarde." },
          { status: 503 },
        );
      }
      if (error.message.includes("JSON")) {
        console.error("JSON parsing error:", error.message);
        return NextResponse.json(
          { error: "Datos inválidos recibidos" },
          { status: 400 },
        );
      }
      if (error.message.includes("UNIQUE constraint failed")) {
        console.error("Email already exists:", error.message);
        return NextResponse.json(
          { error: "El email ya está registrado" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Error en el servidor. Intenta más tarde." },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import {
  adminUserCreateSchema,
  adminUserDeleteSchema,
  adminUserPatchSchema,
} from "@/lib/validation/admin";
import { parseJson, parseSearchParams } from "@/lib/validation/parse";

const USER_SELECT = `
  SELECT
    u.id_user,
    u.username,
    u.date_reg,
    u.state,
    ud.name,
    ud.last_name,
    ud.email,
    ud.tel,
    r.rol
  FROM users u
  INNER JOIN user_data ud ON ud.id_user_data = u.fk_user_data
  INNER JOIN roles r ON r.id_rol = u.fk_rol
`;

export async function GET() {
  try {
    const users = await queryD1<Record<string, unknown>>(
      `${USER_SELECT} ORDER BY u.id_user DESC LIMIT 50`,
      [],
      { revalidate: false },
    );
    const countResult = await queryD1<{ count: number }>(
      "SELECT COUNT(*) as count FROM users",
      [],
      { revalidate: false },
    );
    return NextResponse.json({
      success: true,
      data: users,
      total: countResult[0]?.count ?? users.length,
    });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener usuarios" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, adminUserCreateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, lastName, email, tel, username, rol } = parsed.data;

  try {
    const rolName = rol ?? "customer";
    const rolRows = await queryD1<{ id_rol: number }>(
      `SELECT id_rol FROM roles WHERE rol = ? LIMIT 1`,
      [rolName] as any[],
      { revalidate: false },
    );
    const rolId = rolRows[0]?.id_rol;
    if (!rolId) throw new Error(`Role '${rolName}' not found`);

    await queryD1(
      `INSERT INTO user_data (name, last_name, email, tel, address, password_hash)
       VALUES (?, ?, ?, ?, '', NULL)`,
      [name.trim(), lastName?.trim() ?? "", email.trim(), tel?.trim() ?? ""] as any[],
      { revalidate: false },
    );
    const inserted = await queryD1<{ id_user_data: number }>(
      `SELECT id_user_data FROM user_data WHERE email = ? LIMIT 1`,
      [email.trim()] as any[],
      { revalidate: false },
    );
    const userDataId = inserted[0]?.id_user_data;
    if (!userDataId) throw new Error("user_data insert failed");

    await queryD1(
      `INSERT INTO users (username, date_reg, state, fk_user_data, fk_rol)
       VALUES (?, CURRENT_TIMESTAMP, 1, ?, ?)`,
      [username.trim(), userDataId, rolId] as any[],
      { revalidate: false },
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/users error:", err);
    return NextResponse.json(
      { error: "Error al crear usuario" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParams(
    { id: searchParams.get("id") },
    adminUserDeleteSchema,
    "Datos inválidos",
  );
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id: userId } = parsed.data;
  try {
    await queryD1('UPDATE users SET state = 0 WHERE id_user = ?', [userId] as any[], { revalidate: false });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/admin/users error:', err);
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const parsed = await parseJson(request, adminUserPatchSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id_user, name, lastName, email, tel, state } = parsed.data;

  try {
    if (
      name !== undefined ||
      lastName !== undefined ||
      email !== undefined ||
      tel !== undefined
    ) {
      const updates: string[] = [];
      // Cambiamos el tipo a any[] para no tener conflictos con .push()
      const params: any[] = []; 
      
      if (name !== undefined) {
        updates.push("name = ?");
        params.push(name.trim());
      }
      if (lastName !== undefined) {
        updates.push("last_name = ?");
        params.push(lastName.trim());
      }
      if (email !== undefined) {
        updates.push("email = ?");
        params.push(email.trim());
      }
      if (tel !== undefined) {
        updates.push("tel = ?");
        params.push(tel.trim());
      }
      // Agregamos Number() por seguridad
      params.push(Number(id_user)); 
      
      await queryD1(
        `UPDATE user_data SET ${updates.join(", ")}
         WHERE id_user_data = (SELECT fk_user_data FROM users WHERE id_user = ?)`,
        params,
        { revalidate: false },
      );
    }
    if (state !== undefined) {
      await queryD1(
        `UPDATE users SET state = ? WHERE id_user = ?`,
        [state, id_user] as any[],
        { revalidate: false },
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/admin/users error:", err);
    return NextResponse.json(
      { error: "Error al actualizar usuario" },
      { status: 500 },
    );
  }
}
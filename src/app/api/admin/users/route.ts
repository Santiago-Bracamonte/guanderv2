import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-d1';

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
      'SELECT COUNT(*) as count FROM users',
      [],
      { revalidate: false },
    );
    return NextResponse.json({ success: true, data: users, total: countResult[0]?.count ?? users.length });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ success: false, error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { name?: string; lastName?: string; email?: string; tel?: string; username?: string; rol?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { name, lastName, email, tel, username, rol } = body;
  if (!name?.trim() || !email?.trim() || !username?.trim()) {
    return NextResponse.json({ error: 'Nombre, email y username son requeridos' }, { status: 400 });
  }
  const VALID_ROLES = ['store_owner', 'professional'];
  if (rol && !VALID_ROLES.includes(rol)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
  }

  try {
    const rolName = rol ?? 'store_owner';
    const rolRows = await queryD1<{ id_rol: number }>(
      `SELECT id_rol FROM roles WHERE rol = ? LIMIT 1`,
      [rolName],
      { revalidate: false },
    );
    const rolId = rolRows[0]?.id_rol;
    if (!rolId) throw new Error(`Role '${rolName}' not found`);

    await queryD1(
      `INSERT INTO user_data (name, last_name, email, tel, address, password_hash)
       VALUES (?, ?, ?, ?, '', NULL)`,
      [name.trim(), lastName?.trim() ?? '', email.trim(), tel?.trim() ?? ''],
      { revalidate: false },
    );
    const inserted = await queryD1<{ id_user_data: number }>(
      `SELECT id_user_data FROM user_data WHERE email = ? LIMIT 1`,
      [email.trim()],
      { revalidate: false },
    );
    const userDataId = inserted[0]?.id_user_data;
    if (!userDataId) throw new Error('user_data insert failed');

    await queryD1(
      `INSERT INTO users (username, date_reg, state, fk_user_data, fk_rol)
       VALUES (?, CURRENT_TIMESTAMP, 1, ?, ?)`,
      [username.trim(), userDataId, rolId],
      { revalidate: false },
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/admin/users error:', err);
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: { id_user?: number; name?: string; lastName?: string; email?: string; tel?: string; state?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido' }, { status: 400 });
  }

  const { id_user, name, lastName, email, tel, state } = body;
  if (!id_user) {
    return NextResponse.json({ error: 'id_user es requerido' }, { status: 400 });
  }

  try {
    if (name !== undefined || lastName !== undefined || email !== undefined || tel !== undefined) {
      const updates: string[] = [];
      const params: (string | number | null)[] = [];
      if (name !== undefined) { updates.push('name = ?'); params.push(name.trim()); }
      if (lastName !== undefined) { updates.push('last_name = ?'); params.push(lastName.trim()); }
      if (email !== undefined) { updates.push('email = ?'); params.push(email.trim()); }
      if (tel !== undefined) { updates.push('tel = ?'); params.push(tel.trim()); }
      params.push(id_user);
      await queryD1(
        `UPDATE user_data SET ${updates.join(', ')}
         WHERE id_user_data = (SELECT fk_user_data FROM users WHERE id_user = ?)`,
        params,
        { revalidate: false },
      );
    }
    if (state !== undefined) {
      await queryD1(
        `UPDATE users SET state = ? WHERE id_user = ?`,
        [state, id_user],
        { revalidate: false },
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/admin/users error:', err);
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
  }
}


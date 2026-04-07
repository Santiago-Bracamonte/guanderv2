import { queryD1 } from '@/lib/cloudflare-d1';
import UsuariosClient, { type UserItem } from './UsuariosClient';

interface UserRow {
  id_user?: number;
  username?: string;
  date_reg?: string;
  state?: number;
  name?: string;
  last_name?: string;
  email?: string;
  tel?: string;
  rol?: string;
}

export default async function UsuariosPage() {
  let users: UserItem[] = [];
  let totalUsers = 0;

  try {
    const rows = await queryD1<UserRow>(
      `SELECT
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
       ORDER BY u.id_user DESC LIMIT 50`,
      [],
      { revalidate: false },
    );
    const countResult = await queryD1<{ count: number }>('SELECT COUNT(*) as count FROM users', [], { revalidate: false });
    totalUsers = countResult[0]?.count ?? rows.length;
    users = rows.map((r) => ({
      id_user: r.id_user ?? 0,
      username: r.username ?? '',
      date_reg: r.date_reg ?? '—',
      state: r.state ?? 1,
      name: r.name ?? '',
      last_name: r.last_name ?? '',
      email: r.email ?? '',
      tel: r.tel ?? '',
      rol: r.rol ?? '',
    }));
  } catch {
    totalUsers = 0;
    users = [];
  }

  return <UsuariosClient initialUsers={users} totalUsers={totalUsers} />;
}

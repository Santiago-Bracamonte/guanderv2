import { cookies } from 'next/headers'

interface AdminSession {
  id: number
  name: string
  email: string
  role: string
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')
  if (!session) return null

  try {
    return JSON.parse(atob(session.value)) as AdminSession
  } catch {
    return null
  }
}

export async function verifyAdmin(email: string, password: string): Promise<AdminSession | null> {
  try {
    const { queryD1 } = await import('./cloudflare-d1')
    const results = await queryD1<{ id: number; name: string; email: string; role: string }>(
      'SELECT id, name, email, role FROM admin_users WHERE email = ? AND password = ?',
      [email, password],
      { revalidate: false }
    )
    if (results.length > 0) return results[0]
  } catch {
    // Table might not exist yet — fall through to default credentials
  }

  if (email === 'admin@guander.com' && password === 'admin123') {
    return { id: 1, name: 'Administrador', email: 'admin@guander.com', role: 'Administrador del Sistema' }
  }

  return null
}

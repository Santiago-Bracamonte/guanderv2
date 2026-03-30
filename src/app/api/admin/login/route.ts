import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/admin-auth'

export async function POST(request: Request) {
  let body: { email?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo de solicitud inválido' }, { status: 400 })
  }

  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
  }

  const admin = await verifyAdmin(email, password)

  if (!admin) {
    return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  }

  const sessionData = btoa(JSON.stringify({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  }))

  const response = NextResponse.json({ success: true, admin: { name: admin.name, role: admin.role } })

  response.cookies.set('admin_session', sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return response
}

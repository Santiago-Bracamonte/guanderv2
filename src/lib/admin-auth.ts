import { cookies } from "next/headers";

interface AdminSession {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  if (!session) return null;

  try {
    return JSON.parse(atob(session.value)) as AdminSession;
  } catch {
    return null;
  }
}

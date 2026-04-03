import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { queryD1 } from "@/lib/cloudflare-d1";

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyToken(token) : null;

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const stores = await queryD1<{ id_store: number; name: string; fk_user: number }>(
    `SELECT id_store, name, fk_user FROM stores LIMIT 10`
  );

  return NextResponse.json({
    jwtUserId: user.id,
    jwtEmail: user.email,
    jwtRole: user.role,
    stores,
  });
}

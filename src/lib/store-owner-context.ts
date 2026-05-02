import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { queryD1 } from "@/lib/cloudflare-d1";

export type StoreOwnerContext = {
  userId: number;
  role: "store_owner" | "professional";
  storeId: number;
  storeSubId: number;
  storeName: string;
  professionalId: number | null;
};

export async function getStoreOwnerContext(): Promise<
  { ok: true; context: StoreOwnerContext } | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autenticado" },
        { status: 401 },
      ),
    };
  }

  const user = verifyToken(token);
  if (!user || (user.role !== "store_owner" && user.role !== "professional")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No autorizado" },
        { status: 403 },
      ),
    };
  }

  const stores = await queryD1<{
    id_store: number;
    fk_store_sub_id: number;
    name: string;
  }>(
    `SELECT id_store, fk_store_sub_id, name
     FROM stores
     WHERE fk_user = ?
     ORDER BY id_store ASC
     LIMIT 1`,
    [user.id],
    { revalidate: false },
  );

  const store = stores[0];

  // For professionals: look up the professionals table too
  let professionalId: number | null = null;
  if (user.role === "professional") {
    const profRows = await queryD1<{ id_professional: number }>(
      `SELECT id_professional FROM professionals WHERE fk_user_id = ? LIMIT 1`,
      [user.id],
      { revalidate: false },
    );
    professionalId = profRows[0]?.id_professional ?? null;

    if (!professionalId) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "No se encontró un perfil profesional asociado al usuario" },
          { status: 404 },
        ),
      };
    }
  }

  if (!store) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No se encontró un local asociado al usuario" },
        { status: 404 },
      ),
    };
  }

  return {
    ok: true,
    context: {
      userId: user.id,
      role: user.role as "store_owner" | "professional",
      storeId: store.id_store,
      storeSubId: store.fk_store_sub_id,
      storeName: store.name,
      professionalId,
    },
  };
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { queryD1 } from "@/lib/cloudflare-d1";

export type StoreOwnerContext = {
  userId: number;
  storeId: number;
  storeSubId: number;
  storeName: string;
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
      storeId: store.id_store,
      storeSubId: store.fk_store_sub_id,
      storeName: store.name,
    },
  };
}

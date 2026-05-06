import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import {
  serviceCreateSchema,
  serviceDeleteSchema,
  serviceUpdateSchema,
} from "@/lib/validation/store";
import { parseJson, parseSearchParams } from "@/lib/validation/parse";

export async function GET() {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  const [services, serviceTypes, schedules] = await Promise.all([
    queryD1<{
      id_professional: number;
      description: string;
      address: string;
      location: string;
      accept_point: number;
      stars: number;
      fk_type_service: number;
      fk_schedule: number;
      service_name: string;
      schedule_week: string;
      schedule_weekend: string;
      schedule_sunday: string;
    }>(
      `SELECT
        p.id_professional,
        p.description,
        p.address,
        p.location,
        p.accept_point,
        p.stars,
        p.fk_type_service,
        p.fk_schedule,
        ts.name AS service_name,
        sc.week AS schedule_week,
        sc.weekend AS schedule_weekend,
        sc.sunday AS schedule_sunday
      FROM professionals p
      INNER JOIN type_service ts ON ts.id_type_service = p.fk_type_service
      INNER JOIN schedule sc ON sc.id_schedule = p.fk_schedule
      WHERE p.fk_store_sub_id = ?
      ORDER BY p.id_professional DESC`,
      [context.storeSubId],
      { revalidate: false },
    ),
    queryD1<{ id_type_service: number; name: string }>(
      "SELECT id_type_service, name FROM type_service ORDER BY name ASC",
      [],
      { revalidate: false },
    ),
    queryD1<{ id_schedule: number; week: string; weekend: string; sunday: string }>(
      "SELECT id_schedule, week, weekend, sunday FROM schedule ORDER BY id_schedule ASC",
      [],
      { revalidate: false },
    ),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      services,
      serviceTypes,
      schedules,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  const parsed = await parseJson(request, serviceCreateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { description, address, location, typeServiceId, scheduleId, acceptPoint } =
    parsed.data;
  const acceptPointValue = acceptPoint ? 1 : 0;

  await queryD1(
    `INSERT INTO professionals (
      description,
      address,
      accept_point,
      location,
      stars,
      fk_schedule,
      fk_type_service,
      fk_user_id,
      fk_store_sub_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      description,
      address || context.storeName,
      acceptPointValue,
      location || "0,0",
      0,
      scheduleId,
      typeServiceId,
      context.userId,
      context.storeSubId,
    ] as any[],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  const parsed = await parseJson(request, serviceUpdateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const {
    idProfessional,
    description,
    address,
    location,
    typeServiceId,
    scheduleId,
    acceptPoint,
  } = parsed.data;
  const acceptPointValue = acceptPoint ? 1 : 0;

  const existing = await queryD1<{ id_professional: number }>(
    `SELECT id_professional
     FROM professionals
     WHERE id_professional = ?
       AND fk_store_sub_id = ?
     LIMIT 1`,
    [idProfessional, context.storeSubId] as any[],
    { revalidate: false },
  );

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Servicio no encontrado o no pertenece a tu local" },
      { status: 404 },
    );
  }

  await queryD1(
    `UPDATE professionals
     SET description = ?,
         address = ?,
         location = ?,
         accept_point = ?,
         fk_type_service = ?,
         fk_schedule = ?
     WHERE id_professional = ?
       AND fk_store_sub_id = ?`,
    [
      description,
      address || context.storeName,
      location || "0,0",
      acceptPointValue,
      typeServiceId,
      scheduleId,
      idProfessional,
      context.storeSubId,
    ] as any[],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  const { searchParams } = new URL(request.url);
  const parsed = parseSearchParams(
    { idProfessional: searchParams.get("idProfessional") },
    serviceDeleteSchema,
    "Datos inválidos",
  );
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { idProfessional } = parsed.data;

  const existing = await queryD1<{ id_professional: number }>(
    `SELECT id_professional
     FROM professionals
     WHERE id_professional = ?
       AND fk_store_sub_id = ?
     LIMIT 1`,
    [idProfessional, context.storeSubId] as any[],
    { revalidate: false },
  );

  if (existing.length === 0) {
    return NextResponse.json(
      { error: "Servicio no encontrado o no pertenece a tu local" },
      { status: 404 },
    );
  }

  await queryD1(
    `DELETE FROM professionals
     WHERE id_professional = ?
       AND fk_store_sub_id = ?`,
    [idProfessional, context.storeSubId] as any[],
    { revalidate: false },
  );

  return NextResponse.json({ success: true });
}

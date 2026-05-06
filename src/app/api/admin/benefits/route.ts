import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { ensureBenefitStoreTable } from "@/lib/benefit-store";
import {
  benefitCreateSchema,
  benefitDeleteSchema,
  benefitUpdateSchema,
} from "@/lib/validation/admin";
import { parseJson, parseSearchParams } from "@/lib/validation/parse";

export async function GET() {
  try {
    await ensureBenefitStoreTable();
    const [benefitProf, benefitStore, professionals, stores] =
      await Promise.all([
        queryD1<{
          id_benefit_prof: number;
          description: string;
          percentage: number;
          fk_professional: number;
          professional_name: string;
          professional_last_name: string;
          professional_description: string;
        }>(
          `SELECT
          bp.id_benefit_prof,
          bp.description,
          bp.percentage,
          bp.fk_professional,
          ud.name AS professional_name,
          ud.last_name AS professional_last_name,
          p.description AS professional_description
        FROM benefit_prof bp
        LEFT JOIN professionals p ON p.id_professional = bp.fk_professional
        LEFT JOIN users u ON u.id_user = p.fk_user_id
        LEFT JOIN user_data ud ON ud.id_user_data = u.fk_user_data
        ORDER BY bp.id_benefit_prof DESC`,
          [],
          { revalidate: false },
        ),
        queryD1<{
          id_benefit_store: number;
          description: string;
          percentage: number;
          req_point: number;
          fk_store: number;
          store_name: string;
        }>(
          `SELECT
          bs.id_benefit_store,
          bs.description,
          bs.percentage,
          bs.req_point,
          bs.fk_store,
          s.name AS store_name
        FROM benefit_store bs
        LEFT JOIN stores s ON s.id_store = bs.fk_store
        ORDER BY bs.id_benefit_store DESC`,
          [],
          { revalidate: false },
        ),
        queryD1<{ id_professional: number; name: string; last_name: string }>(
          `SELECT
          p.id_professional,
          ud.name,
          ud.last_name
        FROM professionals p
        LEFT JOIN users u ON u.id_user = p.fk_user_id
        LEFT JOIN user_data ud ON ud.id_user_data = u.fk_user_data
        ORDER BY ud.name ASC`,
          [],
          { revalidate: false },
        ),
        queryD1<{ id_store: number; name: string }>(
          `SELECT id_store, name FROM stores ORDER BY name ASC`,
          [],
          { revalidate: false },
        ),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        benefitProf,
        benefitStore,
        professionals,
        stores,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/benefits error:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener beneficios" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureBenefitStoreTable();
    const parsed = await parseJson(request, benefitCreateSchema, "Datos inválidos");
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { description, percentage, type, fkProfessional, fkStore } = parsed.data;

    if (type === "professional") {
      await queryD1(
        `INSERT INTO benefit_prof (description, percentage, fk_professional)
         VALUES (?, ?, ?)`,
        [description, percentage, fkProfessional] as any[],
        { revalidate: false },
      );
    } else {
      await queryD1(
        `INSERT INTO benefit_store (description, percentage, req_point, fk_store)
         VALUES (?, ?, ?, ?)`,
        [description, percentage, 0, fkStore] as any[],
        { revalidate: false },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/admin/benefits error:", err);
    return NextResponse.json(
      { success: false, error: "Error al crear beneficio" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await ensureBenefitStoreTable();
    const parsed = await parseJson(request, benefitUpdateSchema, "Datos inválidos");
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { description, percentage, type, idBenefitProf, idBenefitStore } = parsed.data;

    if (type === "professional") {

      const existing = await queryD1<{ id_benefit_prof: number }>(
        `SELECT id_benefit_prof FROM benefit_prof WHERE id_benefit_prof = ? LIMIT 1`,
        [idBenefitProf] as any[],
        { revalidate: false },
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Beneficio no encontrado" },
          { status: 404 },
        );
      }

      await queryD1(
        `UPDATE benefit_prof SET description = ?, percentage = ? WHERE id_benefit_prof = ?`,
        [description, percentage, idBenefitProf] as any[],
        { revalidate: false },
      );
    } else {
      const existing = await queryD1<{ id_benefit_store: number }>(
        `SELECT id_benefit_store FROM benefit_store WHERE id_benefit_store = ? LIMIT 1`,
        [idBenefitStore] as any[],
        { revalidate: false },
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Beneficio no encontrado" },
          { status: 404 },
        );
      }

      await queryD1(
        `UPDATE benefit_store SET description = ?, percentage = ? WHERE id_benefit_store = ?`,
        [description, percentage, idBenefitStore] as any[],
        { revalidate: false },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/admin/benefits error:", err);
    return NextResponse.json(
      { success: false, error: "Error al actualizar beneficio" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parseSearchParams(
      { id: searchParams.get("id"), type: searchParams.get("type") },
      benefitDeleteSchema,
      "Datos inválidos",
    );
    if (!parsed.data) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { id, type } = parsed.data;

    if (type === "professional") {
      const existing = await queryD1<{ id_benefit_prof: number }>(
        `SELECT id_benefit_prof FROM benefit_prof WHERE id_benefit_prof = ? LIMIT 1`,
        [id] as any[],
        { revalidate: false },
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Beneficio no encontrado" },
          { status: 404 },
        );
      }

      await queryD1(
        `DELETE FROM benefit_prof WHERE id_benefit_prof = ?`,
        [id] as any[],
        { revalidate: false },
      );
    } else {
      const existing = await queryD1<{ id_benefit_store: number }>(
        `SELECT id_benefit_store FROM benefit_store WHERE id_benefit_store = ? LIMIT 1`,
        [id] as any[],
        { revalidate: false },
      );

      if (existing.length === 0) {
        return NextResponse.json(
          { error: "Beneficio no encontrado" },
          { status: 404 },
        );
      }

      await queryD1(
        `DELETE FROM benefit_store WHERE id_benefit_store = ?`,
        [id] as any[],
        { revalidate: false },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/admin/benefits error:", err);
    return NextResponse.json(
      { success: false, error: "Error al eliminar beneficio" },
      { status: 500 },
    );
  }
}
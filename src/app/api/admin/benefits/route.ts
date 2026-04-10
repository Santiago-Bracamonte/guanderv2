import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";

type BenefitInput = {
  idBenefitProf?: number;
  idBenefitStore?: number;
  description?: string;
  percentage?: number;
  fkProfessional?: number;
  fkStore?: number;
  type?: "professional" | "store";
};

function toSafeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function toPositiveFloat(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 100) return null;
  return parsed;
}

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

export async function GET() {
  try {
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
    let body: BenefitInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Cuerpo JSON inválido" },
        { status: 400 },
      );
    }

    const description = toSafeText(body.description, 300);
    const percentage = toPositiveFloat(body.percentage);
    const benefitType = body.type === "professional" ? "professional" : "store";

    if (!description || percentage === null) {
      return NextResponse.json(
        { error: "Descripción y porcentaje son obligatorios" },
        { status: 400 },
      );
    }

    if (benefitType === "professional") {
      const fkProfessional = toPositiveInt(body.fkProfessional);
      if (!fkProfessional) {
        return NextResponse.json(
          { error: "Profesional es obligatorio" },
          { status: 400 },
        );
      }

      await queryD1(
        `INSERT INTO benefit_prof (description, percentage, fk_professional)
         VALUES (?, ?, ?)`,
        [description, percentage, fkProfessional],
        { revalidate: false },
      );
    } else {
      const fkStore = toPositiveInt(body.fkStore);
      if (!fkStore) {
        return NextResponse.json(
          { error: "Tienda es obligatoria" },
          { status: 400 },
        );
      }

      await queryD1(
        `INSERT INTO benefit_store (description, percentage, req_point, fk_store)
         VALUES (?, ?, ?, ?)`,
        [description, percentage, 0, fkStore],
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
    let body: BenefitInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Cuerpo JSON inválido" },
        { status: 400 },
      );
    }

    const description = toSafeText(body.description, 300);
    const percentage = toPositiveFloat(body.percentage);
    const benefitType = body.type === "professional" ? "professional" : "store";

    if (!description || percentage === null) {
      return NextResponse.json(
        { error: "Descripción y porcentaje son obligatorios" },
        { status: 400 },
      );
    }

    if (benefitType === "professional") {
      const idBenefitProf = toPositiveInt(body.idBenefitProf);
      if (!idBenefitProf) {
        return NextResponse.json(
          { error: "ID de beneficio requerido" },
          { status: 400 },
        );
      }

      const existing = await queryD1<{ id_benefit_prof: number }>(
        `SELECT id_benefit_prof FROM benefit_prof WHERE id_benefit_prof = ? LIMIT 1`,
        [idBenefitProf],
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
        [description, percentage, idBenefitProf],
        { revalidate: false },
      );
    } else {
      const idBenefitStore = toPositiveInt(body.idBenefitStore);
      if (!idBenefitStore) {
        return NextResponse.json(
          { error: "ID de beneficio requerido" },
          { status: 400 },
        );
      }

      const existing = await queryD1<{ id_benefit_store: number }>(
        `SELECT id_benefit_store FROM benefit_store WHERE id_benefit_store = ? LIMIT 1`,
        [idBenefitStore],
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
        [description, percentage, idBenefitStore],
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
    const id = toPositiveInt(searchParams.get("id"));
    const type =
      searchParams.get("type") === "professional" ? "professional" : "store";

    if (!id) {
      return NextResponse.json({ error: "ID es obligatorio" }, { status: 400 });
    }

    if (type === "professional") {
      const existing = await queryD1<{ id_benefit_prof: number }>(
        `SELECT id_benefit_prof FROM benefit_prof WHERE id_benefit_prof = ? LIMIT 1`,
        [id],
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
        [id],
        { revalidate: false },
      );
    } else {
      const existing = await queryD1<{ id_benefit_store: number }>(
        `SELECT id_benefit_store FROM benefit_store WHERE id_benefit_store = ? LIMIT 1`,
        [id],
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
        [id],
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

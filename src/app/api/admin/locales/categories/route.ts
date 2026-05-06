import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import {
  categoryCreateSchema,
  categoryDeleteSchema,
  categoryUpdateSchema,
} from "@/lib/validation/admin";
import { parseJson, parseSearchParams } from "@/lib/validation/parse";

interface CategoryRow {
  id_category: number;
  name: string;
  description: string;
}

export async function GET() {
  try {
    const categories = await queryD1<CategoryRow>(
      "SELECT id_category, name, description FROM category ORDER BY name ASC",
      [],
      { revalidate: false },
    );
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json({
      success: true,
      data: [
        {
          id_category: 1,
          name: "Veterinaria",
          description: "Servicios veterinarios para mascotas",
        },
        {
          id_category: 2,
          name: "Pet Shop",
          description: "Tienda de productos para mascotas",
        },
        {
          id_category: 3,
          name: "Cafetería",
          description: "Cafés pet-friendly",
        },
        {
          id_category: 4,
          name: "Restaurante",
          description: "Restaurantes pet-friendly",
        },
        {
          id_category: 5,
          name: "Grooming",
          description: "Peluquería y spa para mascotas",
        },
        {
          id_category: 6,
          name: "Resort",
          description: "Hospedaje y alojamiento para mascotas",
        },
      ],
    });
  }
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, categoryCreateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { name, description } = parsed.data;

  try {
    // Insert the category
    await queryD1(
      "INSERT INTO category (name, description) VALUES (?, ?)",
      [name.trim(), description?.trim() || ""],
      { revalidate: false },
    );

    // Get the last inserted category
    const result = await queryD1<{ id_category: number }>(
      "SELECT id_category FROM category WHERE name = ? ORDER BY id_category DESC LIMIT 1",
      [name.trim()],
      { revalidate: false },
    );

    if (result && result.length > 0) {
      const categoryId = result[0].id_category;
      return NextResponse.json({
        success: true,
        data: {
          id_category: categoryId,
          name: name.trim(),
          description: description?.trim() || "",
        },
      });
    } else {
      return NextResponse.json(
        { error: "No se pudo obtener el ID de la categoría" },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error al crear categoría:", error);
    return NextResponse.json(
      { error: "Error al crear categoría" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const parsed = await parseJson(request, categoryUpdateSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id, name, description } = parsed.data;

  try {
    await queryD1(
      "UPDATE category SET name = ?, description = ? WHERE id_category = ?",
      [name.trim(), description?.trim() || "", id] as any[],
      { revalidate: false },
    );

    return NextResponse.json({
      success: true,
      data: {
        id_category: id,
        name: name.trim(),
        description: description?.trim() || "",
      },
    });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    return NextResponse.json(
      { error: "Error al actualizar categoría" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const parsed = parseSearchParams(
    { id: url.searchParams.get("id") },
    categoryDeleteSchema,
    "Datos inválidos",
  );
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { id } = parsed.data;

  try {
    // Check if category is in use
    const stores = await queryD1<{ count: number }>(
      "SELECT COUNT(*) as count FROM stores WHERE fk_category = ?",
      [Number(id)],
      { revalidate: false },
    );

    if (stores?.[0]?.count && stores[0].count > 0) {
      return NextResponse.json(
        {
          error: `No se puede eliminar. Hay ${stores[0].count} locales usando esta categoría.`,
        },
        { status: 400 },
      );
    }

    await queryD1("DELETE FROM category WHERE id_category = ?", [Number(id)], {
      revalidate: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    return NextResponse.json(
      { error: "Error al eliminar categoría" },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getAllNotificationLimits,
  updateNotificationLimitsByTier,
  type LimitConfig,
  type PlanTier,
} from "@/lib/notification-plan-limits";
import { adminNotificationLimitsSchema } from "@/lib/validation/admin";
import { parseJson } from "@/lib/validation/parse";

async function requireAdmin() {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;

  const limitsByTier = await getAllNotificationLimits();

  return NextResponse.json({
    success: true,
    data: {
      limits: limitsByTier,
    },
  });
}

export async function PUT(request: NextRequest) {
  const unauthorized = await requireAdmin();
  if (unauthorized) return unauthorized;
  const parsed = await parseJson(request, adminNotificationLimitsSchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { tier, cooldownMinutes, maxPerHour, maxPerDay, maxPerMonth } = parsed.data;

  const limits: LimitConfig = {
    cooldownMinutes: Number(cooldownMinutes),
maxPerHour: Number(maxPerHour),
maxPerDay: Number(maxPerDay),
maxPerMonth: Number(maxPerMonth),
  };

  await updateNotificationLimitsByTier(tier, limits);

  const updated = await getAllNotificationLimits();

  return NextResponse.json({
    success: true,
    data: {
      updatedTier: tier,
      limits: updated,
    },
  });
}

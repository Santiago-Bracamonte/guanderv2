import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin-auth";
import {
  getAllNotificationLimits,
  updateNotificationLimitsByTier,
  type LimitConfig,
  type PlanTier,
} from "@/lib/notification-plan-limits";

type UpdateLimitsInput = {
  tier?: PlanTier;
  cooldownMinutes?: number;
  maxPerHour?: number;
  maxPerDay?: number;
  maxPerMonth?: number;
};

function toIntInRange(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function isTier(value: unknown): value is PlanTier {
  return value === "basic" || value === "plus" || value === "premium";
}

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

  let body: UpdateLimitsInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  if (!isTier(body.tier)) {
    return NextResponse.json(
      { error: "tier debe ser basic, plus o premium" },
      { status: 400 },
    );
  }

  const cooldownMinutes = toIntInRange(body.cooldownMinutes, 1, 1440);
  const maxPerHour = toIntInRange(body.maxPerHour, 1, 5000);
  const maxPerDay = toIntInRange(body.maxPerDay, 1, 5000);
  const maxPerMonth = toIntInRange(body.maxPerMonth, 1, 50000);

  if (
    cooldownMinutes === null ||
    maxPerHour === null ||
    maxPerDay === null ||
    maxPerMonth === null
  ) {
    return NextResponse.json(
      {
        error:
          "cooldownMinutes, maxPerHour, maxPerDay y maxPerMonth deben ser enteros validos",
      },
      { status: 400 },
    );
  }

  if (maxPerHour > maxPerDay || maxPerDay > maxPerMonth) {
    return NextResponse.json(
      {
        error:
          "La jerarquia de limites debe cumplir: maxPerHour <= maxPerDay <= maxPerMonth",
      },
      { status: 400 },
    );
  }

  const limits: LimitConfig = {
    cooldownMinutes,
    maxPerHour,
    maxPerDay,
    maxPerMonth,
  };

  await updateNotificationLimitsByTier(body.tier, limits);

  const updated = await getAllNotificationLimits();

  return NextResponse.json({
    success: true,
    data: {
      updatedTier: body.tier,
      limits: updated,
    },
  });
}

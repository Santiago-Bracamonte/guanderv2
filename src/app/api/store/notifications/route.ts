import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import {
  getNotificationLimitsByTier,
  type LimitConfig,
  type PlanTier,
} from "@/lib/notification-plan-limits";

type PushInput = {
  title?: string;
  message?: string;
  expirationDays?: number;
};

type StorePlanInfo = {
  name: string;
  amount: number;
  tier: PlanTier;
};

function toSafeText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function toIntInRange(value: unknown, min: number, max: number): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return null;
  if (parsed < min || parsed > max) return null;
  return parsed;
}

function getTierFromRank(rank: number, totalPlans: number): PlanTier {
  if (totalPlans <= 1) return "basic";
  if (rank === totalPlans - 1) return "premium";
  if (rank >= Math.ceil(totalPlans / 2)) return "plus";
  return "basic";
}

async function resolveStorePlan(storeSubId: number): Promise<StorePlanInfo> {
  const currentPlanRows = await queryD1<{
    plan_name: string;
    plan_amount: number;
  }>(
    `SELECT sub.name AS plan_name, sub.amount AS plan_amount
     FROM store_sub ss
     INNER JOIN subscription sub ON sub.id_subscription = ss.fk_subscription_id
     WHERE ss.id_store_sub = ?
     LIMIT 1`,
    [storeSubId],
    { revalidate: false },
  );

  const currentPlan = currentPlanRows[0];
  if (!currentPlan) {
    return {
      name: "Sin plan",
      amount: 0,
      tier: "basic",
    };
  }

  const allPlans = await queryD1<{ amount: number }>(
    `SELECT amount
     FROM subscription
     WHERE LOWER(state) = 'activo'
     ORDER BY amount ASC`,
    [],
    { revalidate: false },
  );

  const rank = allPlans.findIndex((row) => Number(row.amount) === Number(currentPlan.plan_amount));
  const tier = getTierFromRank(rank === -1 ? 0 : rank, allPlans.length || 1);

  return {
    name: currentPlan.plan_name,
    amount: Number(currentPlan.plan_amount),
    tier,
  };
}

async function ensureAuditTable(): Promise<void> {
  await queryD1(
    `CREATE TABLE IF NOT EXISTS store_push_audit (
      id_push_audit INTEGER PRIMARY KEY AUTOINCREMENT,
      fk_store INTEGER NOT NULL,
      fk_user INTEGER NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      recipient_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    [],
    { revalidate: false },
  );
}

async function getRateWindow(storeId: number, limits: LimitConfig) {
  const [hourRows, dayRows, monthRows, latestRows] = await Promise.all([
    queryD1<{ value: number }>(
      `SELECT COUNT(*) AS value
       FROM store_push_audit
       WHERE fk_store = ?
         AND DATETIME(created_at) >= DATETIME('now', '-1 hour')`,
      [storeId],
      { revalidate: false },
    ),
    queryD1<{ value: number }>(
      `SELECT COUNT(*) AS value
       FROM store_push_audit
       WHERE fk_store = ?
         AND DATETIME(created_at) >= DATETIME('now', '-1 day')`,
      [storeId],
      { revalidate: false },
    ),
    queryD1<{ value: number }>(
      `SELECT COUNT(*) AS value
       FROM store_push_audit
       WHERE fk_store = ?
         AND DATETIME(created_at) >= DATETIME('now', 'start of month')
         AND DATETIME(created_at) < DATETIME('now', 'start of month', '+1 month')`,
      [storeId],
      { revalidate: false },
    ),
    queryD1<{ created_at: string }>(
      `SELECT created_at
       FROM store_push_audit
       WHERE fk_store = ?
       ORDER BY DATETIME(created_at) DESC
       LIMIT 1`,
      [storeId],
      { revalidate: false },
    ),
  ]);

  const sentLastHour = hourRows[0]?.value ?? 0;
  const sentLastDay = dayRows[0]?.value ?? 0;
  const sentThisMonth = monthRows[0]?.value ?? 0;

  const latest = latestRows[0]?.created_at;
  let cooldownRemainingMinutes = 0;

  if (latest) {
    const latestDate = new Date(`${latest.replace(" ", "T")}Z`);
    if (!Number.isNaN(latestDate.getTime())) {
      const nextAllowed = latestDate.getTime() + limits.cooldownMinutes * 60_000;
      const remaining = Math.ceil((nextAllowed - Date.now()) / 60_000);
      cooldownRemainingMinutes = Math.max(remaining, 0);
    }
  }

  return {
    sentLastHour,
    sentLastDay,
    sentThisMonth,
    cooldownRemainingMinutes,
    remainingHour: Math.max(limits.maxPerHour - sentLastHour, 0),
    remainingDay: Math.max(limits.maxPerDay - sentLastDay, 0),
    remainingMonth: Math.max(limits.maxPerMonth - sentThisMonth, 0),
  };
}

async function findRecipientUsers(storeId: number, ownerUserId: number): Promise<number[]> {
  const rows = await queryD1<{ user_id: number }>(
    `SELECT DISTINCT user_id
     FROM (
       SELECT c.fk_user AS user_id
       FROM store_purchase sp
       INNER JOIN customer c ON c.id_customer = sp.fk_customer
       WHERE sp.fk_store = ?

       UNION

       SELECT c.fk_user AS user_id
       FROM coupon_buy_store cbs
       INNER JOIN customer c ON c.id_customer = cbs.fk_customer_id
       INNER JOIN coupon_store cs ON cs.id_coupon = cbs.fk_coupon_id
       WHERE cs.fk_store = ?

       UNION

       SELECT c.fk_user AS user_id
       FROM comments_store cm
       INNER JOIN customer c ON c.id_customer = cm.fk_customer_id
       WHERE cm.fk_store_id = ?

       UNION

       SELECT ? AS user_id
     )
     WHERE user_id IS NOT NULL
     LIMIT 400`,
    [storeId, storeId, storeId, ownerUserId],
    { revalidate: false },
  );

  return rows.map((row) => row.user_id);
}

export async function GET(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;
  void request;

  await ensureAuditTable();
  const plan = await resolveStorePlan(context.storeSubId);
  const limits = await getNotificationLimitsByTier(plan.tier);
  const rate = await getRateWindow(context.storeId, limits);

  return NextResponse.json({
    success: true,
    data: {
      plan,
      limits,
      rate,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  let body: PushInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON invalido" }, { status: 400 });
  }

  const title = toSafeText(body.title, 90);
  const message = toSafeText(body.message, 450);
  const expirationDays = toIntInRange(body.expirationDays, 1, 30) ?? 7;

  if (!title || !message) {
    return NextResponse.json(
      { error: "El titulo y el mensaje de la notificacion son obligatorios" },
      { status: 400 },
    );
  }

  await ensureAuditTable();

  const plan = await resolveStorePlan(context.storeSubId);
  const limits = await getNotificationLimitsByTier(plan.tier);
  const rate = await getRateWindow(context.storeId, limits);

  if (rate.cooldownRemainingMinutes > 0) {
    return NextResponse.json(
      {
        error: `Debes esperar ${rate.cooldownRemainingMinutes} minutos para volver a enviar notificaciones`,
        data: { plan, limits, rate },
      },
      { status: 429 },
    );
  }

  if (rate.sentLastHour >= limits.maxPerHour) {
    return NextResponse.json(
      {
        error: "Ya alcanzaste el maximo de notificaciones por hora",
        data: { plan, limits, rate },
      },
      { status: 429 },
    );
  }

  if (rate.sentLastDay >= limits.maxPerDay) {
    return NextResponse.json(
      {
        error: "Ya alcanzaste el maximo de notificaciones por dia",
        data: { plan, limits, rate },
      },
      { status: 429 },
    );
  }

  if (rate.sentThisMonth >= limits.maxPerMonth) {
    return NextResponse.json(
      {
        error: "Ya alcanzaste el cupo mensual de notificaciones de tu plan",
        data: { plan, limits, rate },
      },
      { status: 429 },
    );
  }

  const recipientUsers = await findRecipientUsers(context.storeId, context.userId);

  await queryD1(
    `INSERT INTO notifications (name, description, expiration_date)
     VALUES (?, ?, DATE('now', ?))`,
    [title, message, `+${expirationDays} day`],
    { revalidate: false },
  );

  const inserted = await queryD1<{ id_notification: number }>(
    `SELECT id_notification
     FROM notifications
     WHERE name = ?
       AND description = ?
     ORDER BY id_notification DESC
     LIMIT 1`,
    [title, message],
    { revalidate: false },
  );

  const notificationId = inserted[0]?.id_notification;
  if (!notificationId) {
    return NextResponse.json(
      { error: "No se pudo recuperar la notificacion creada" },
      { status: 500 },
    );
  }

  for (const userId of recipientUsers) {
    await queryD1(
      `INSERT INTO notif_users (fk_notifications_id, fk_users_id, state)
       VALUES (?, ?, 0)`,
      [notificationId, userId],
      { revalidate: false },
    );
  }

  await queryD1(
    `INSERT INTO store_push_audit (fk_store, fk_user, title, body, recipient_count)
     VALUES (?, ?, ?, ?, ?)`,
    [
      context.storeId,
      context.userId,
      title,
      message,
      recipientUsers.length,
    ],
    { revalidate: false },
  );

  const updatedRate = await getRateWindow(context.storeId, limits);

  return NextResponse.json({
    success: true,
    data: {
      notification: {
        id_notification: notificationId,
        name: title,
        description: message,
        expiration_date: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        state: 0,
      },
      recipients: recipientUsers.length,
      plan,
      limits,
      rate: updatedRate,
    },
  });
}

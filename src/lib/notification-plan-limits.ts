import { queryD1 } from "@/lib/cloudflare-d1";

export type PlanTier = "basic" | "plus" | "premium";

export type LimitConfig = {
  cooldownMinutes: number;
  maxPerHour: number;
  maxPerDay: number;
  maxPerMonth: number;
};

export const DEFAULT_NOTIFICATION_LIMITS: Record<PlanTier, LimitConfig> = {
  basic: {
    cooldownMinutes: 60,
    maxPerHour: 1,
    maxPerDay: 1,
    maxPerMonth: 5,
  },
  plus: {
    cooldownMinutes: 30,
    maxPerHour: 1,
    maxPerDay: 2,
    maxPerMonth: 10,
  },
  premium: {
    cooldownMinutes: 15,
    maxPerHour: 2,
    maxPerDay: 5,
    maxPerMonth: 20,
  },
};

export async function ensureNotificationLimitTable(): Promise<void> {
  await queryD1(
    `CREATE TABLE IF NOT EXISTS notification_plan_limits (
      id_notification_plan_limit INTEGER PRIMARY KEY AUTOINCREMENT,
      tier TEXT NOT NULL UNIQUE,
      cooldown_minutes INTEGER NOT NULL,
      max_per_hour INTEGER NOT NULL,
      max_per_day INTEGER NOT NULL,
      max_per_month INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    [],
    { revalidate: false },
  );

  for (const tier of Object.keys(DEFAULT_NOTIFICATION_LIMITS) as PlanTier[]) {
    const limit = DEFAULT_NOTIFICATION_LIMITS[tier];
    await queryD1(
      `INSERT INTO notification_plan_limits (
        tier,
        cooldown_minutes,
        max_per_hour,
        max_per_day,
        max_per_month
      ) VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(tier) DO UPDATE SET
        cooldown_minutes = excluded.cooldown_minutes,
        max_per_hour = excluded.max_per_hour,
        max_per_day = excluded.max_per_day,
        max_per_month = excluded.max_per_month,
        updated_at = CURRENT_TIMESTAMP`,
      [
        tier,
        limit.cooldownMinutes,
        limit.maxPerHour,
        limit.maxPerDay,
        limit.maxPerMonth,
      ],
      { revalidate: false },
    );
  }
}

export async function getAllNotificationLimits(): Promise<Record<PlanTier, LimitConfig>> {
  await ensureNotificationLimitTable();

  const rows = await queryD1<{
    tier: string;
    cooldown_minutes: number;
    max_per_hour: number;
    max_per_day: number;
    max_per_month: number;
  }>(
    `SELECT tier, cooldown_minutes, max_per_hour, max_per_day, max_per_month
     FROM notification_plan_limits`,
    [],
    { revalidate: false },
  );

  const mapped = { ...DEFAULT_NOTIFICATION_LIMITS };

  for (const row of rows) {
    if (row.tier !== "basic" && row.tier !== "plus" && row.tier !== "premium") {
      continue;
    }

    mapped[row.tier] = {
      cooldownMinutes: row.cooldown_minutes,
      maxPerHour: row.max_per_hour,
      maxPerDay: row.max_per_day,
      maxPerMonth: row.max_per_month,
    };
  }

  return mapped;
}

export async function getNotificationLimitsByTier(tier: PlanTier): Promise<LimitConfig> {
  const all = await getAllNotificationLimits();
  return all[tier] ?? DEFAULT_NOTIFICATION_LIMITS.basic;
}

export async function updateNotificationLimitsByTier(
  tier: PlanTier,
  limits: LimitConfig,
): Promise<void> {
  await ensureNotificationLimitTable();

  await queryD1(
    `INSERT INTO notification_plan_limits (
      tier,
      cooldown_minutes,
      max_per_hour,
      max_per_day,
      max_per_month,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(tier)
    DO UPDATE SET
      cooldown_minutes = excluded.cooldown_minutes,
      max_per_hour = excluded.max_per_hour,
      max_per_day = excluded.max_per_day,
      max_per_month = excluded.max_per_month,
      updated_at = CURRENT_TIMESTAMP`,
    [
      tier,
      limits.cooldownMinutes,
      limits.maxPerHour,
      limits.maxPerDay,
      limits.maxPerMonth,
    ],
    { revalidate: false },
  );
}

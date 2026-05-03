/**
 * Plan limits derived from the subscription plan name.
 *
 * Huellita Basica : 2 photos · 10 services · 2 coupons  · 5 notifications/month  · normal exposure
 * Patita Premium  : 5 photos · 20 services · 7 coupons  · 10 notifications/month · alta exposure
 * Guander Pro     : 10 photos · unlimited  · 20 coupons · 30 notifications/month · destacada exposure
 */

export type PlanLimits = {
  maxPhotos: number;
  /** -1 = unlimited */
  maxServices: number;
  maxCoupons: number;
  maxNotificationsPerMonth: number;
  exposureLevel: "normal" | "alta" | "destacada";
};

export function getPlanLimitsFromBenefits(raw: string | null | undefined): PlanLimits | null {
  if (!raw?.trim()) return null;

  const text = raw.toLowerCase();

  const readLimit = (pattern: RegExp): number | null => {
    const match = text.match(pattern);
    if (!match) return null;
    const value = Number(match[1]);
    return Number.isFinite(value) ? value : null;
  };

  const hasUnlimitedServices = /(servicios\s+ilimitad|ilimitados\s+servicios)/i.test(text);
  const maxPhotos = readLimit(/hasta\s+(\d+)\s+fotos?/i);
  const maxServices = hasUnlimitedServices ? -1 : readLimit(/hasta\s+(\d+)\s+servicios/i);
  const maxCoupons = readLimit(/hasta\s+(\d+)\s+cupones/i);
  const maxNotifications = readLimit(/hasta\s+(\d+)\s+notificaciones/i);

  let exposureLevel: PlanLimits["exposureLevel"] = "normal";
  if (/exposicion\s+destacad|destacad[ao]/i.test(text)) {
    exposureLevel = "destacada";
  } else if (/exposicion\s+alta|alta\s+exposicion/i.test(text)) {
    exposureLevel = "alta";
  }

  if (
    maxPhotos === null &&
    maxServices === null &&
    maxCoupons === null &&
    maxNotifications === null
  ) {
    return null;
  }

  return {
    maxPhotos: maxPhotos ?? 0,
    maxServices: maxServices ?? 0,
    maxCoupons: maxCoupons ?? 0,
    maxNotificationsPerMonth: maxNotifications ?? 0,
    exposureLevel,
  };
}

export function getPlanLimits(planName: string | null | undefined): PlanLimits {
  const name = (planName ?? "").toLowerCase();

  if (name.includes("pro")) {
    return {
      maxPhotos: 10,
      maxServices: -1,
      maxCoupons: 20,
      maxNotificationsPerMonth: 30,
      exposureLevel: "destacada",
    };
  }

  if (name.includes("premium") || name.includes("patita")) {
    return {
      maxPhotos: 5,
      maxServices: 20,
      maxCoupons: 7,
      maxNotificationsPerMonth: 10,
      exposureLevel: "alta",
    };
  }

  // Default: Huellita Basica / any unrecognised plan
  return {
    maxPhotos: 2,
    maxServices: 10,
    maxCoupons: 2,
    maxNotificationsPerMonth: 5,
    exposureLevel: "normal",
  };
}

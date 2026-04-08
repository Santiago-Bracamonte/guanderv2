import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CloudflareD1Error, queryD1 } from "@/lib/cloudflare-d1";
import { verifyToken } from "@/lib/auth";
import LocalDashboardClient from "../dashboard/store/LocalDashboardClient";
import type {
  BenefitRow,
  CouponConsumptionRow,
  CouponRow,
  DashboardData,
  NotificationRow,
  PurchaseRow,
  ReviewRow,
  ServiceRow,
  StoreSummaryRow,
} from "../dashboard/store/types";

type NumberRow = { value: number | null };

async function loadDashboardData(userId: number): Promise<DashboardData | null> {
  const stores = await queryD1<StoreSummaryRow>(
    `SELECT
      s.id_store,
      s.name,
      s.description,
      s.address,
      s.location,
      s.stars,
      s.fk_user,
      s.fk_store_sub_id,
      c.name AS category_name,
      sub.name AS plan_name,
      sub.amount AS plan_amount,
      sub.state AS plan_state,
      ss.expiration_date AS plan_expiration_date,
      ss.state_payout AS payout_state
    FROM stores s
    LEFT JOIN category c ON c.id_category = s.fk_category
    LEFT JOIN store_sub ss ON ss.id_store_sub = s.fk_store_sub_id
    LEFT JOIN subscription sub ON sub.id_subscription = ss.fk_subscription_id
    WHERE s.fk_user = ?
    LIMIT 1`,
    [userId]
  );

  const store = stores[0];
  if (!store) {
    return null;
  }

  const [
    servicesCountRows,
    activeCouponsRows,
    avgRatingRows,
    totalReviewsRows,
    monthlySalesAmountRows,
    monthlySalesCountRows,
    reviews,
    purchases,
    coupons,
    benefits,
    services,
    notifications,
    couponConsumptions,
  ] = await Promise.all([
    queryD1<NumberRow>(
      `SELECT COUNT(*) AS value
       FROM professionals
       WHERE fk_store_sub_id = ?`,
      [store.fk_store_sub_id]
    ),
    queryD1<NumberRow>(
      `SELECT COUNT(*) AS value
       FROM coupon_store
       WHERE fk_store = ?
         AND state = 1
         AND DATE(expiration_date) >= DATE('now')`,
      [store.id_store]
    ),
    queryD1<NumberRow>(
      `SELECT COALESCE(AVG(stars), 0) AS value
       FROM comments_store
       WHERE fk_store_id = ?`,
      [store.id_store]
    ),
    queryD1<NumberRow>(
      `SELECT COUNT(*) AS value
       FROM comments_store
       WHERE fk_store_id = ?`,
      [store.id_store]
    ),
    queryD1<NumberRow>(
      `SELECT COALESCE(SUM(amount), 0) AS value
       FROM store_purchase
       WHERE fk_store = ?
         AND STRFTIME('%Y-%m', date) = STRFTIME('%Y-%m', 'now')`,
      [store.id_store]
    ),
    queryD1<NumberRow>(
      `SELECT COUNT(*) AS value
       FROM store_purchase
       WHERE fk_store = ?
         AND STRFTIME('%Y-%m', date) = STRFTIME('%Y-%m', 'now')`,
      [store.id_store]
    ),
    queryD1<ReviewRow>(
      `SELECT
        cs.id_comment,
        cs.body,
        cs.stars,
        cs.date,
        ud.name AS customer_name,
        ud.last_name AS customer_last_name
      FROM comments_store cs
      INNER JOIN customer c ON c.id_customer = cs.fk_customer_id
      INNER JOIN users u ON u.id_user = c.fk_user
      INNER JOIN user_data ud ON ud.id_user_data = u.fk_user_data
      WHERE cs.fk_store_id = ?
      ORDER BY DATETIME(cs.date) DESC
      LIMIT 5`,
      [store.id_store]
    ),
    queryD1<PurchaseRow>(
      `SELECT
        sp.id_store_purchase,
        sp.date,
        sp.amount,
        sp.points_earn,
        ud.name AS customer_name,
        ud.last_name AS customer_last_name
      FROM store_purchase sp
      INNER JOIN customer c ON c.id_customer = sp.fk_customer
      INNER JOIN users u ON u.id_user = c.fk_user
      INNER JOIN user_data ud ON ud.id_user_data = u.fk_user_data
      WHERE sp.fk_store = ?
      ORDER BY DATETIME(sp.date) DESC
      LIMIT 6`,
      [store.id_store]
    ),
    queryD1<CouponRow>(
      `SELECT
        cs.id_coupon,
        cs.name,
        cs.code_coupon,
        cs.amount,
        cs.point_req,
        cs.expiration_date,
        cs.state,
        cst.name AS coupon_state_name,
        COALESCE(cbs.redemptions, 0) AS redemptions
      FROM coupon_store cs
      LEFT JOIN coupon_state cst ON cst.id_coupon_state = cs.fk_coupon_state
      LEFT JOIN (
        SELECT fk_coupon_id, COUNT(*) AS redemptions
        FROM coupon_buy_store
        GROUP BY fk_coupon_id
      ) cbs ON cbs.fk_coupon_id = cs.id_coupon
      WHERE cs.fk_store = ?
      ORDER BY cs.id_coupon DESC
      LIMIT 6`,
      [store.id_store]
    ),
    queryD1<BenefitRow>(
      `SELECT
        id_benefit_store,
        description,
        percentage,
        req_point
      FROM benefit_store
      WHERE fk_store = ?
      ORDER BY id_benefit_store DESC
      LIMIT 3`,
      [store.id_store]
    ),
    queryD1<ServiceRow>(
      `SELECT
        p.id_professional,
        ts.name AS service_name,
        p.stars,
        p.accept_point
      FROM professionals p
      INNER JOIN type_service ts ON ts.id_type_service = p.fk_type_service
      WHERE p.fk_store_sub_id = ?
      ORDER BY p.id_professional DESC
      LIMIT 5`,
      [store.fk_store_sub_id]
    ),
    queryD1<NotificationRow>(
      `SELECT
        n.id_notification,
        n.name,
        n.description,
        n.expiration_date,
        nu.state
      FROM notif_users nu
      INNER JOIN notifications n ON n.id_notification = nu.fk_notifications_id
      WHERE nu.fk_users_id = ?
      ORDER BY n.id_notification DESC
      LIMIT 4`,
      [store.fk_user]
    ),
    queryD1<CouponConsumptionRow>(
      `SELECT
        cbs.id_coupon_buy,
        cs.name AS coupon_name,
        cs.code_coupon,
        ud.name AS customer_name,
        ud.last_name AS customer_last_name,
        cs.amount,
        cs.point_req
      FROM coupon_buy_store cbs
      INNER JOIN coupon_store cs ON cs.id_coupon = cbs.fk_coupon_id
      INNER JOIN customer c ON c.id_customer = cbs.fk_customer_id
      INNER JOIN users u ON u.id_user = c.fk_user
      INNER JOIN user_data ud ON ud.id_user_data = u.fk_user_data
      WHERE cs.fk_store = ?
      ORDER BY cbs.id_coupon_buy DESC
      LIMIT 8`,
      [store.id_store]
    ),
  ]);

  return {
    store,
    servicesCount: servicesCountRows[0]?.value ?? 0,
    activeCouponsCount: activeCouponsRows[0]?.value ?? 0,
    avgStoreRating: Number(avgRatingRows[0]?.value ?? 0),
    totalReviews: totalReviewsRows[0]?.value ?? 0,
    monthlySalesAmount: monthlySalesAmountRows[0]?.value ?? 0,
    monthlySalesCount: monthlySalesCountRows[0]?.value ?? 0,
    reviews,
    purchases,
    coupons,
    benefits,
    services,
    notifications,
    couponConsumptions,
  };
}

export default async function LocalDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const user = token ? verifyToken(token) : null;

  if (!user || user.role !== "store_owner") {
    redirect("/login");
  }

  let data: DashboardData | null = null;
  let error: string | null = null;

  try {
    data = await loadDashboardData(user.id);
  } catch (err) {
    error = err instanceof CloudflareD1Error ? err.message : "No se pudo cargar el dashboard.";
  }

  return <LocalDashboardClient data={data} error={error} />;
}

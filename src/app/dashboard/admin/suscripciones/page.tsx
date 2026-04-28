import { queryD1 } from '@/lib/cloudflare-d1';
import SuscripcionesClient from './SuscripcionesClient';

interface InstanceRow {
  id_store_sub: number;
  state_payout: string;
  expiration_date: string;
  upgrade_date: string;
  fk_subscription_id: number;
  plan_name: string;
  plan_amount: number;
  entity_type: 'store' | 'professional';
  entity_id: number;
  entity_name: string;
  owner_name: string;
  owner_email: string;
  payout_count: number;
  last_payout_date: string | null;
  last_payout_amount: number | null;
}

interface PlanRow {
  id_subscription: number;
  name: string;
  amount: number;
}

export default async function SuscripcionesPage() {
  let instances: InstanceRow[] = [];
  let plans: PlanRow[] = [];

  try {
    instances = await queryD1<InstanceRow>(
      `SELECT
         ss.id_store_sub,
         ss.state_payout,
         ss.expiration_date,
         ss.upgrade_date,
         ss.fk_subscription_id,
         sub.name   AS plan_name,
         sub.amount AS plan_amount,
         CASE WHEN st.id_store IS NOT NULL THEN 'store' ELSE 'professional' END AS entity_type,
         COALESCE(st.id_store, pr.id_professional) AS entity_id,
         COALESCE(st.name, ts.name) AS entity_name,
         ud.name || ' ' || ud.last_name AS owner_name,
         ud.email AS owner_email,
         COALESCE(pc.payout_count, 0) AS payout_count,
         lp.last_payout_date,
         lp.last_payout_amount
       FROM store_sub ss
       INNER JOIN subscription sub ON sub.id_subscription = ss.fk_subscription_id
       LEFT JOIN stores       st ON st.fk_store_sub_id = ss.id_store_sub
       LEFT JOIN professionals pr ON pr.fk_store_sub_id = ss.id_store_sub
         AND st.id_store IS NULL
       LEFT JOIN type_service ts ON ts.id_type_service = pr.fk_type_service
       LEFT JOIN users u ON (
         CASE WHEN st.id_store IS NOT NULL THEN st.fk_user ELSE pr.fk_user_id END = u.id_user
       )
       LEFT JOIN user_data ud ON ud.id_user_data = u.fk_user_data
       LEFT JOIN (
         SELECT fk_store_sub, COUNT(*) AS payout_count
         FROM sub_payout
         GROUP BY fk_store_sub
       ) pc ON pc.fk_store_sub = ss.id_store_sub
       LEFT JOIN (
         SELECT fk_store_sub,
                MAX(date)   AS last_payout_date,
                amount      AS last_payout_amount
         FROM sub_payout
         GROUP BY fk_store_sub
       ) lp ON lp.fk_store_sub = ss.id_store_sub
       ORDER BY ss.expiration_date ASC`,
      [],
      { revalidate: false },
    );
  } catch {
    instances = [];
  }

  try {
    plans = await queryD1<PlanRow>(
      "SELECT id_subscription, name, amount FROM subscription WHERE state = 'activo' ORDER BY amount ASC",
      [],
      { revalidate: false },
    );
  } catch {
    plans = [];
  }

  return <SuscripcionesClient initialInstances={instances} initialPlans={plans} />;
}

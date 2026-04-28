import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/cloudflare-d1';

export interface CouponRow {
  id_coupon: number;
  owner_type: 'profesional' | 'local';
  owner_name: string;
  name: string;
  description: string;
  expiration_date: string;
  point_req: number;
  amount: number;
  code_coupon: string;
  state_name: string;
}

export async function GET() {
  try {
    const [profCoupons, storeCoupons] = await Promise.all([
      queryD1<CouponRow>(
        `SELECT
          cp.id_coupon,
          'profesional' AS owner_type,
          (ud.name || ' ' || ud.last_name) AS owner_name,
          cp.name,
          cp.description,
          cp.expiration_date,
          cp.point_req,
          cp.amount,
          cp.code_coupon,
          cs.name AS state_name
        FROM coupon_prof cp
        JOIN coupon_state cs ON cp.fk_coupon_state = cs.id_coupon_state
        JOIN professionals p ON cp.fk_professional_id = p.id_professional
        JOIN users u ON p.fk_user_id = u.id_user
        JOIN user_data ud ON u.fk_user_data = ud.id_user_data
        ORDER BY cp.expiration_date DESC`,
        [],
        { revalidate: false },
      ),
      queryD1<CouponRow>(
        `SELECT
          cs_c.id_coupon,
          'local' AS owner_type,
          s.name AS owner_name,
          cs_c.name,
          cs_c.description,
          cs_c.expiration_date,
          cs_c.point_req,
          cs_c.amount,
          cs_c.code_coupon,
          cs_state.name AS state_name
        FROM coupon_store cs_c
        JOIN coupon_state cs_state ON cs_c.fk_coupon_state = cs_state.id_coupon_state
        JOIN stores s ON cs_c.fk_store = s.id_store
        ORDER BY cs_c.expiration_date DESC`,
        [],
        { revalidate: false },
      ),
    ]);

    const coupons: CouponRow[] = [...profCoupons, ...storeCoupons].sort(
      (a, b) => (b.expiration_date ?? '').localeCompare(a.expiration_date ?? ''),
    );

    return NextResponse.json({ success: true, coupons });
  } catch (e) {
    console.error('admin coupons GET error', e);
    return NextResponse.json({ success: false, coupons: [] }, { status: 500 });
  }
}

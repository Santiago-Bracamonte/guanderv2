export type StoreSummaryRow = {
  id_store: number;
  name: string;
  description: string;
  address: string;
  location: string;
  stars: number;
  fk_user: number;
  fk_store_sub_id: number;
  category_name: string | null;
  plan_name: string | null;
  plan_amount: number | null;
  plan_state: string | null;
  plan_expiration_date: string | null;
  payout_state: string | null;
};

export type ReviewRow = {
  id_comment: number;
  body: string;
  stars: number;
  date: string;
  customer_name: string;
  customer_last_name: string;
};

export type PurchaseRow = {
  id_store_purchase: number;
  date: string;
  amount: number;
  points_earn: number;
  customer_name: string;
  customer_last_name: string;
};

export type CouponRow = {
  id_coupon: number;
  name: string;
  code_coupon: string;
  amount: number;
  point_req: number;
  expiration_date: string;
  state: number;
  coupon_state_name: string | null;
  redemptions: number;
};

export type BenefitRow = {
  id_benefit_store: number;
  description: string;
  percentage: number;
  req_point: number;
};

export type ServiceRow = {
  id_professional: number;
  service_name: string;
  stars: number;
  accept_point: number;
};

export type NotificationRow = {
  id_notification: number;
  name: string;
  description: string;
  expiration_date: string;
  state: number;
};

export type CouponConsumptionRow = {
  id_coupon_buy: number;
  coupon_name: string;
  code_coupon: string;
  customer_name: string;
  customer_last_name: string;
  amount: number;
  point_req: number;
};

export type DashboardData = {
  store: StoreSummaryRow;
  servicesCount: number;
  activeCouponsCount: number;
  avgStoreRating: number;
  totalReviews: number;
  monthlySalesAmount: number;
  monthlySalesCount: number;
  reviews: ReviewRow[];
  purchases: PurchaseRow[];
  coupons: CouponRow[];
  benefits: BenefitRow[];
  services: ServiceRow[];
  notifications: NotificationRow[];
  couponConsumptions: CouponConsumptionRow[];
};

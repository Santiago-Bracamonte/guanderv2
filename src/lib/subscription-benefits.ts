import { queryD1 } from "@/lib/cloudflare-d1";

export async function ensureSubscriptionBenefitsColumn(): Promise<void> {
  try {
    await queryD1(
      "ALTER TABLE subscription ADD COLUMN plan_benefits TEXT",
      [],
      { revalidate: false },
    );
  } catch {
    // Column likely already exists.
  }
}

import { queryD1 } from "@/lib/cloudflare-d1";

export async function ensureBenefitStoreTable(): Promise<void> {
  await queryD1(
    `CREATE TABLE IF NOT EXISTS benefit_store (
      id_benefit_store  INTEGER PRIMARY KEY AUTOINCREMENT,
      description       TEXT NOT NULL,
      req_point         INTEGER NOT NULL,
      percentage        REAL NOT NULL,
      fk_store          INTEGER NOT NULL,
      FOREIGN KEY (fk_store) REFERENCES stores(id_store) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    [],
    { revalidate: false },
  );

  await queryD1(
    "CREATE INDEX IF NOT EXISTS idx_benefit_store_store ON benefit_store(fk_store)",
    [],
    { revalidate: false },
  );
}

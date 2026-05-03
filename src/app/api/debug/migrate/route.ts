import { NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";

export async function GET() {
  try {
    await queryD1(
      `CREATE TABLE IF NOT EXISTS benefit_store (
        id_benefit_store  INTEGER PRIMARY KEY AUTOINCREMENT,
        description       TEXT NOT NULL,
        req_point         INTEGER NOT NULL,
        percentage        INTEGER NOT NULL,
        fk_store          INTEGER NOT NULL,
        FOREIGN KEY (fk_store) REFERENCES stores(id_store) ON UPDATE CASCADE
      )`
    );
    
    await queryD1(
      `CREATE INDEX IF NOT EXISTS idx_benefit_store_store ON benefit_store(fk_store)`
    );

    await queryD1(
      `CREATE TABLE IF NOT EXISTS sub_payout (
        id_sub_payout  INTEGER PRIMARY KEY AUTOINCREMENT,
        date           TEXT NOT NULL,
        amount         REAL NOT NULL,
        description    TEXT DEFAULT NULL,
        proof_url      TEXT DEFAULT NULL,
        status         TEXT DEFAULT 'pending',
        fk_store_sub   INTEGER NOT NULL,
        fk_user        INTEGER NOT NULL,
        FOREIGN KEY (fk_store_sub) REFERENCES store_sub(id_store_sub) ON UPDATE CASCADE,
        FOREIGN KEY (fk_user)      REFERENCES users(id_user)           ON UPDATE CASCADE
      )`
    );

    try {
        await queryD1(`ALTER TABLE store_sub ADD COLUMN state_payout TEXT DEFAULT 'pending'`);
    } catch (e) {
        // Ignorar si la columna ya existe
    }

    return NextResponse.json({ success: true, message: "Migraciones aplicadas localmente" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

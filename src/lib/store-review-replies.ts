import { queryD1 } from "@/lib/cloudflare-d1";

export async function ensureStoreReviewRepliesTable(): Promise<void> {
  await queryD1(
    `CREATE TABLE IF NOT EXISTS comments_store_reply (
      id_comment_reply INTEGER PRIMARY KEY AUTOINCREMENT,
      fk_comment_store INTEGER NOT NULL,
      fk_store_user INTEGER NOT NULL,
      body TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (fk_comment_store) REFERENCES comments_store(id_comment) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (fk_store_user) REFERENCES users(id_user) ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    [],
    { revalidate: false },
  );
}

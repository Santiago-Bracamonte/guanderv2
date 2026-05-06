import { NextRequest, NextResponse } from "next/server";
import { queryD1 } from "@/lib/cloudflare-d1";
import { getStoreOwnerContext } from "@/lib/store-owner-context";
import { ensureStoreReviewRepliesTable } from "@/lib/store-review-replies";
import { reviewReplySchema } from "@/lib/validation/store";
import { parseJson } from "@/lib/validation/parse";

export async function POST(request: NextRequest) {
  const auth = await getStoreOwnerContext();
  if (!auth.ok) return auth.response;

  const { context } = auth;

  const parsed = await parseJson(request, reviewReplySchema, "Datos inválidos");
  if (!parsed.data) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { commentId, body: replyBody } = parsed.data;

  await ensureStoreReviewRepliesTable();

  const commentRows = await queryD1<{
    id_comment: number;
    customer_user_id: number;
  }>(
    `SELECT
      cs.id_comment,
      c.fk_user AS customer_user_id
    FROM comments_store cs
    INNER JOIN customer c ON c.id_customer = cs.fk_customer_id
    WHERE cs.id_comment = ?
      AND cs.fk_store_id = ?
    LIMIT 1`,
    [commentId, context.storeId] as any[],
    { revalidate: false },
  );

  const comment = commentRows[0];
  if (!comment) {
    return NextResponse.json(
      { error: "La reseña no existe o no pertenece a tu local" },
      { status: 404 },
    );
  }

  await queryD1(
    `INSERT INTO comments_store_reply (fk_comment_store, fk_store_user, body)
     VALUES (?, ?, ?)`,
    [commentId, context.userId, replyBody] as any[],
    { revalidate: false },
  );

  const insertedReply = await queryD1<{
    id_comment_reply: number;
    fk_comment_id: number;
    body: string;
    date: string;
    responder_name: string;
  }>(
    `SELECT
      csr.id_comment_reply,
      csr.fk_comment_store AS fk_comment_id,
      csr.body,
      csr.date,
      s.name AS responder_name
    FROM comments_store_reply csr
    INNER JOIN stores s ON s.fk_user = csr.fk_store_user
    WHERE csr.fk_comment_store = ?
      AND csr.fk_store_user = ?
    ORDER BY csr.id_comment_reply DESC
    LIMIT 1`,
    [commentId, context.userId] as any[],
    { revalidate: false },
  );

  const reply = insertedReply[0];
  if (!reply) {
    return NextResponse.json(
      { error: "No se pudo recuperar la respuesta creada" },
      { status: 500 },
    );
  }

  const notificationTitle = `Te respondieron una reseña en ${context.storeName}`;
  const notificationBody = replyBody.length > 240 ? `${replyBody.slice(0, 237)}...` : replyBody;

  await queryD1(
    `INSERT INTO notifications (name, description, expiration_date)
     VALUES (?, ?, DATE('now', '+30 day'))`,
    [notificationTitle, notificationBody],
    { revalidate: false },
  );

  const notificationRows = await queryD1<{ id_notification: number }>(
    `SELECT id_notification
     FROM notifications
     WHERE name = ?
       AND description = ?
     ORDER BY id_notification DESC
     LIMIT 1`,
    [notificationTitle, notificationBody],
    { revalidate: false },
  );

  const notificationId = notificationRows[0]?.id_notification;
  if (notificationId) {
    await queryD1(
      `INSERT INTO notif_users (fk_notifications_id, fk_users_id, state)
       VALUES (?, ?, 0)`,
      [notificationId, comment.customer_user_id],
      { revalidate: false },
    );
  }

  return NextResponse.json({
    success: true,
    data: { reply },
  });
}
